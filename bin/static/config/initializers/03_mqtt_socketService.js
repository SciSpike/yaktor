var path = require('path')
var logger = require(path.resolve('node_modules/conversation/lib/logger')) // eslint-disable-line no-unused-vars
var EventEmitter = require('events').EventEmitter
var EventEmitter2 = require('eventemitter2')

module.exports = function () {
  var ws = require('websocket-stream')
  var Connection = require('mqtt-connection')
  var socketService = require(path.resolve('node_modules/conversation/app/services/socketService.js'))
  var app = this
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
    var emitter = new EventEmitter()
    var semitter = new EventEmitter2({
      wildcard: true,
      delimiter: ':'
    })
    emitter.setMaxListeners(0)
    var emit = emitter.emit
    emitter.emit = function (st, data) {
      semitter.emit(st, data)
    }
    var conn = new Connection(stream)

    conn.once('connect', function (op) {
      var authToken = op.username === 'Bearer' && op.password ? op.password.toString() : ''
      var sessionId = op.clientId
      socketService.onConnect(app, sessionId, authToken, emitter, function () {
        conn.end()
      }, function (err, session, user) { // eslint-disable-line handle-callback-err
        if (!user) {
          conn.connack({
            returnCode: 5
          })
        } else {
          socketService.startListening(emitter, sessionId, session, user)
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
      emit.call(emitter, 'close')
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
        var m = colonTopic || slashTopic
        if (slashTopic) {
          topic = m[ 1 ] + ':state:' + m[ 2 ] + ':' + m[ 3 ]
        }
        conn[ packet.topic ] = conn[ packet.topic ] || 0
        // only .on the first time
        if (conn[packet.topic]++ < 1) {
          semitter.on(topic, function (data) {
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
        if (m) {
          var init = m[ 1 ] + '::init'
          emit.call(emitter, init, {
            _id: m[ 3 ]
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
          emit.call(emitter, deinit, {
            _id: m[ 3 ]
          })
        }
        // only .off the last time
        if (--conn[packet.topic] < 1) {
          semitter.removeAllListeners(topic)
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
        // XXX Only replace first slash
        topic = topic.replace('/', '::')
      }
      emit.call(emitter, topic, JSON.parse(packet.payload.toString()))
      if (packet.messageId) {
        conn.puback({
          messageId: packet.messageId
        })
      }
    })
  }
  // store for later and remove httpListener.
  var httpListener = app.server.listeners('connection')[ 0 ]
  app.server.removeListener('connection', httpListener)
  // taste incoming socket for HTTP[S]. WS is still HTTP.
  var testFn = function (stream) {
    var that = this
    stream.once('data', function (d) {
      stream.pause()
      stream.unshift(d)
      /*
       * Because:
       * In HTTP 1.0 and 1.1 Request-Line which begins with a method token (or a printable chars like [P]OST [G]ET). Also servers SHOULD ignore any empty line(s) received where a Request-Line is expected [rfc2616-sec4.1] [rfc2616-sec5.1]
       * AND 
       * In MQTT the first Packet sent from the Client to the Server MUST be a CONNECT Packet [MQTT-3.1.0-1]. 
       * Therefore:
       * A valid MQTT request begin with 0x10 and a HTTP request must not
       */
      if(d[0]===0x10||d[0]===String.fromCharCode(0x10)){
        fn.call(that,stream)
      } else {
        httpHandler.call(that,stream)
      }
      stream.resume()
    })
  }
  app.server.on('connection', testFn)
  ws.createServer({
    path: '/mqtt',
    server: app.server
  }, mqttListener)
}
