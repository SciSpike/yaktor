var EventEmitter = require('emitter-component')
var Backo = require('backo')
var log = require('../logger')
// define some stuff in the global space
var globalSockets = {}
var globalConnections = {}
var hb_interval = 30000
var globalEmitter = new EventEmitter()
var createSocket = (typeof require !== 'undefined' && require.resolve) ? function (url) {
  var sjsc = require('sockjs-client-ws')
  var client = sjsc.create(url)
  /* eslint-disable accessor-pairs */
  Object.defineProperty(client, 'onopen', {
    set: function (cb) {
      this.on('connection', cb)
    }
  })
  Object.defineProperty(client, 'onheartbeat', {
    set: function (cb) {
      this.on('heartbeat', cb)
    }
  })
  Object.defineProperty(client, 'onclose', {
    set: function (cb) {
      if (cb) {
        this.on('close', function (msg) {
          var e = {
            data: msg
          }
          cb(e)
        })
        this.on('error', function (msg) {
          var e = {
            data: msg
          }
          cb(e)
        })
      } else {
        this.removeAllListeners('close')
        this.removeAllListeners('error')
      }
    }
  })
  Object.defineProperty(client, 'onmessage', {
    set: function (cb) {
      this.on('data', function (msg) {
        var e = {
          data: msg
        }
        cb(e)
      })
    }
  })
  /* eslint-enable accessor-pairs */
  client.send = client.write
  return client
} : function (url) {
  /* global SockJS */
  return new SockJS(url)
}
var socketApi = {
  send: function (sessionId, data, callback) {
    if (globalSockets[ sessionId ]) {
      globalSockets[ sessionId ].socket.send(data)
      if (callback) {
        callback()
      }
      if (globalSockets[ sessionId ].debug) {
        log.silly('%s: sending', data)
      }
    } else {
      if (callback) {
        callback(new Error('No Connection'))
      }
    }
  },
  emitter: globalEmitter,
  disconnect: function (sessionId) {
    var socket = globalSockets[ sessionId ].socket
    var debug = globalSockets[ sessionId ].debug
    delete globalSockets[ sessionId ]
    socket.onclose = null
    socket.close()
    globalConnections[ sessionId ] = false
    if (debug) {
      log.silly('%s: disconnecting', sessionId)
    }
  },
  connectWithPrefix: function (urlPrefix, sessionId, authFunction, isDebug, callback) {
    var connectEmitter = new EventEmitter()
    connectEmitter.on('error', function () {})
    var hb_timeout = null
    var backoff = new Backo({
      max: 2 * 60 * 1000
    })
    if (isDebug) {
      log.silly('connecting with %s', sessionId)
    }
    var doReconnect = function (sessionId, reAuth) {
      if (isDebug) {
        log.silly('reconnecting with %s', sessionId)
      }
      socketApi.disconnect(sessionId)
      doConnect(sessionId, reAuth)
    }
    var resetHeartbeatTimer = function (sessionId) {
      clearTimeout(hb_timeout)
      hb_timeout = setTimeout(function () {
        doReconnect(sessionId)
      }, hb_interval)
    }
    var doConnect = function (sessionId, reAuth) {
      globalConnections[ sessionId ] = true
      authFunction(function (err, token, newSessionId) { // eslint-disable-line handle-callback-err
        newSessionId = newSessionId || sessionId
        var url = '/ws/' + newSessionId
        if (urlPrefix) {
          url = urlPrefix + url
        }
        var thisUrl = url + (token ? '/auth/' + token : '')
        globalEmitter.once(newSessionId + ':connected', function (data) {
          globalSockets[ sessionId ] = {
            socket: mySocket,
            debug: isDebug
          }
          globalEmitter.emit(sessionId + ':connect', data)
        })
        globalEmitter.once(newSessionId + ':error', function (data) {
          clearTimeout(hb_timeout)
          globalSockets[ sessionId ] = {
            socket: mySocket,
            debug: isDebug
          }
          socketApi.disconnect(sessionId)
          globalEmitter.emit(sessionId + ':error', new Error(data.type))
        })
        globalEmitter.once(newSessionId + ':unauthorized', function (data) {
          clearTimeout(hb_timeout)
          globalSockets[ sessionId ] = {
            socket: mySocket,
            debug: isDebug
          }
          doReconnect(sessionId, true)
        })
        var mySocket = createSocket(thisUrl)
        mySocket.onopen = function () {
          backoff.reset()
          resetHeartbeatTimer(sessionId)
          if (isDebug) {
            log.silly('%s: connected with', sessionId)
          }
        }
        mySocket.onmessage = function (e) {
          var msg = JSON.parse(e.data)
          globalEmitter.emit(msg.event, msg.data)
          if (isDebug) {
            log.silly('%s, receiving:', sessionId, e.data)
          }
        }
        mySocket.onheartbeat = function () {
          if (isDebug) {
            log.silly('h')
          }
          resetHeartbeatTimer(sessionId)
        }
        mySocket.onclose = function (e) {
          clearTimeout(hb_timeout)
          globalConnections[ sessionId ] = false
          delete globalSockets[ sessionId ]
          if (isDebug) {
            console.error('Connection error %s', e.data)
          }
          setTimeout(function () {
            doConnect(sessionId)
          }, backoff.duration())
          globalEmitter.emit(sessionId + ':error', new Error('disconnected'))
          globalEmitter.removeAllListeners(newSessionId + ':connected')
          globalEmitter.removeAllListeners(newSessionId + ':error')
          globalEmitter.removeAllListeners(newSessionId + ':unauthorized')
        }
      }, !!reAuth)
    }
    var notYetCalledCallback = callback
    // Handle Events regardless of who manages the connections
    globalEmitter.once(sessionId + ':connect', function (data) {
      if (isDebug) {
        log.silly('api connected with %s', sessionId)
      }
      if (notYetCalledCallback) {
        var cb = notYetCalledCallback
        notYetCalledCallback = null
        cb(globalSockets[ sessionId ].socket, null, sessionId)
      }
    })
    globalEmitter.on(sessionId + ':connect', function (data) {
      if (isDebug) {
        log.silly('%s: connected', sessionId)
      }
      connectEmitter.emit('connect', null)
    })
    globalEmitter.on(sessionId + ':error', function (data) {
      if (isDebug) {
        log.silly('%s: error', sessionId, JSON.stringify(data.stack, null, 2))
      }
      connectEmitter.emit('error', data)
    })
    var connected = globalSockets[ sessionId ]
    if (connected) {
      if (notYetCalledCallback) {
        if (isDebug) {
          log.silly('api already connected just calling cb with %s', sessionId)
        }
        var cb = notYetCalledCallback
        notYetCalledCallback = null
        cb(globalSockets[ sessionId ].socket, null, sessionId)
      }
    } else
    // If not in the process/connected
    if (!globalConnections[ sessionId ]) {
      doConnect(sessionId)
    }

    return connectEmitter
  },
  connect: function (sessionId, authFunction, isDebug, callback) {
    return socketApi.connectWithPrefix(null, sessionId, authFunction, isDebug, callback)
  }
}
module.exports = socketApi
