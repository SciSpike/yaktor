var logger = require('yaktor/logger')
logger.info(__filename)
var EventEmitter = require('events').EventEmitter
var EventEmitter2 = require('eventemitter2')

/**
 * event API
 * MQTT 3.1.1 via WS and TCP streams
 * OAuth Token Authentication
 * MQTT broker details:
 *  * QOS 0 supported (we don't persist sessions or messages).
 *  * QOS 1 or 2 allowed. Connections requesting either will be treated as QOS 0. However we will generate a message id and ACKs.
 */
module.exports = function (ctx, done) {
  var ws = require('websocket-stream')
  var Connection = require('mqtt-connection')
  var socketService = require('yaktor/services/socketService')
  var nextId = 0
  var newId = function () {
    var id = nextId++
    nextId %= 65536
    return id
  }
  var calculateGranted = function (packet) {
    return packet.subscriptions.map(function (e) {
      if (e.qos === 2) {
        e.qos = 1
      }
      return e.qos
    })
  }

  var mqttListener = function (stream) {
    var serverEmitter = new EventEmitter()
    serverEmitter.setMaxListeners(0)

    var clientEmitter = new EventEmitter2({
      wildcard: true,
      delimiter: ':'
    })

    // keep this so we can emit events to socketService
    var serverEmit = serverEmitter.emit.bind(serverEmitter)
    // when we hand the serverEmitter to socket service we want to proxy emits to the client
    serverEmitter.emit = function (st, data) {
      clientEmitter.emit(st, data)
    }

    var conn = new Connection(stream)

    conn.once('connect', function (op) {
      var authToken = op.username === 'Bearer' && op.password ? op.password.toString() : ''
      var sessionId = op.clientId
      socketService.onConnect(sessionId, authToken, serverEmitter, function () {
        conn.end()
      }, function (err, session, user) {
        if (err || !user) {
          conn.connack({
            // Connection Refused, not authorized
            returnCode: 0x05
          })
          // send an appropriate CONNACK response with a non-zero return code as described in section 3.2 and it MUST close the Network Connection [MQTT-3.1.4]
          conn.end()
        } else {
          socketService.startListening(serverEmitter, sessionId, session, user)
          conn.connack({
            returnCode: 0,
            sessionPresent: false
          })
        }
      })
    })
    conn.on('pingreq', function () {
      conn.pingresp()
    })
    conn.on('disconnect', function () {
      conn.destroy()
    })
    conn.once('close', function () {
      serverEmit('close')
    })
    /**
     * subscribe API
     * {convo}.{agent}/state/[+|{stateName}]/{agentId}
     *
     * Payload will be ignored.
     *
     * Clients are expected to subscribe after connect/reconnect. We won't remember you!
     *
     * You will automatically recieve a message for the current state of the agent.
     * You will then receive all state transition that match {stateName} or '+' wildcard.
     */
    conn.on('subscribe', function (packet) {
      packet.subscriptions.forEach(function (packet) {
        var topic = packet.topic.replace(/#/g, '**').replace(/\+/g, '*')
        var colonTopic = /([^:]+):state:([^:]+):(.*)/.exec(topic)
        var slashTopic = /([^\/]+)\/state\/([^\/]+)\/(.*)/.exec(topic)
        var matches = colonTopic || slashTopic
        if (slashTopic) {
          topic = matches[ 1 ] + ':state:' + matches[ 2 ] + ':' + matches[ 3 ]
        }
        conn[ packet.topic ] = conn[ packet.topic ] || 0
        // only .on the first time
        if (conn[ packet.topic ]++ < 1) {
          clientEmitter.on(topic, function (data) {
            var sendTopic = this.event
            // Client sent / so send /
            if (slashTopic) {
              sendTopic = sendTopic.replace(/:/g, '/')
            }
            conn.publish({
              topic: sendTopic,
              payload: JSON.stringify(data),
              qos: 0,
              messageId: newId()
            })
          })
        }
        // autoInit
        if (matches) {
          var init = matches[ 1 ] + '::init'
          serverEmit(init, {
            _id: matches[ 3 ]
          })
        }
      })
      if (packet.messageId) {
        conn.suback({
          messageId: packet.messageId,
          granted: calculateGranted(packet)
        })
      }
    })

    /**
     * unsubscribe API
     * {convo}.{agent}/state/[+|{stateName}]/{agentId}
     *
     * Payload will be ignored.
     *
     * If you disconnect you unsubscribe is not necessary.
     * unsubscribe SHOULD (must?) be symmetric with subscribe calls.
     * Unknown results if they are not.
     * At minimum you are likely to have a memory leak of event listeners on client and/or server if you don't.
     */
    conn.on('unsubscribe', function (packet) {
      packet.unsubscriptions.forEach(function (t) {
        var topic = t.replace(/#/g, '**').replace(/\+/g, '*')
        var colonTopic = /([^:]+):state:([^:]+):(.*)/.exec(topic)
        var slashTopic = /([^\/]+)\/state\/([^\/]+)\/(.*)/.exec(topic)
        var m = colonTopic || slashTopic
        if (slashTopic) {
          topic = m[ 1 ] + ':state:' + m[ 2 ] + ':' + m[ 3 ]
        }
        // autoInit
        if (m) {
          var deinit = m[ 1 ] + '::deinit'
          serverEmit(deinit, {
            _id: m[ 3 ]
          })
        }
        // only .off the last time
        if (--conn[ packet.topic ] < 1) {
          clientEmitter.removeAllListeners(topic)
        }
      })
      if (packet.messageId) {
        conn.unsuback({
          messageId: packet.messageId
        })
      }
    })
    /**
     * publish API
     * {convo}.{agent}/{send}
     * Payload: '{"agentData":{"_id":"...","data":{...}}'
     */
    conn.on('publish', function (packet) {
      var topic = packet.topic
      if (topic.indexOf('::') < 0) {
        // NOTE: Only replace first slash
        topic = topic.replace('/', '::')
      }
      serverEmit(topic, JSON.parse(packet.payload.toString()))
      if (packet.messageId) {
        conn.puback({
          messageId: packet.messageId
        })
      }
    })
  }
  var server = ctx.server

  // store for later and remove httpListener.
  var httpListener = server.listeners('connection')[ 0 ]
  server.removeListener('connection', httpListener)

  /*
   * Taste incoming socket connection.
   * It is either HTTP or MQTT protocol or we will fail.
   */
  var protocolTester = function (stream) {
    var that = this
    stream.once('data', function (d) {
      stream.pause()
      stream.unshift(d)
      /*
       * Because:
       * In HTTP 1.0 and 1.1 Request-Line which begins with a method token (or printable chars like [P]OST [G]ET).
       * Also servers SHOULD ignore any empty line(s) received where a Request-Line is expected [rfc2616-sec4.1] [rfc2616-sec5.1]
       * AND
       * In MQTT the first Packet sent from the Client to the Server MUST be a CONNECT Packet [MQTT-3.1.0-1].
       * Therefore:
       * A valid MQTT request begins with 0x10 and a HTTP request must not
       */
      if (d[ 0 ] === 0x10 || d[ 0 ] === String.fromCharCode(0x10)) {
        mqttListener.call(that, stream)
      } else {
        httpListener.call(that, stream)
      }
      stream.resume()
    })
  }

  // register protocolTester adding MQTT/TCP to this socket.
  server.on('connection', protocolTester)

  var serverPath = ctx.mqtt.path
  if (serverPath.indexOf('/') !== 0) serverPath = '/' + serverPath

  // register ws (mqttListener) adding MQTT/WS to this socket.
  ws.createServer({
    path: serverPath,
    server: server
  }, mqttListener)

  done()
}
