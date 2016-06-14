var logger = require('../../lib/logger.js')
var events = require('events')
var async = require('async')

var messageService = require('./messageService')

var noAuthen = function (arg, cb) {
  cb(null, true, {
    scope: '*'
  }, null)
}
var noAuth = function (arg, cb) {
  cb(null, true)
}
var noSession = function (sessionId, cb) {
  cb(null, {})
}

var SocketService = {
  agents: {},
  onConnect: function (app, sessionId, authToken, emitter, endFn, done) {
    var yaktor = app.yaktor
    var authenticate = yaktor.tokenAuthenticate ? yaktor.tokenAuthenticate : noAuthen
    var getSession = yaktor.getSession || noSession
    var authorize = yaktor.authorize ? yaktor.authorize : noAuth
    async.waterfall([
      async.apply(authenticate, authToken),
      function (user, info, token, cb) {
        if (cb && token) {
          var now = new Date()
          var root = token.root
          var kill = 'kill:::' + root
          var t = setTimeout(function () {
            logger.debug('︻デ┳═ー expired %s at: %s; now: %s; ttl: %s;', kill, token.expires, now, token.expires - now)
            endFn()
          }, Math.min(0x7fffffff, token.expires - now))
          var killer = function (date) {
            logger.silly('$$$$$$ might kill if %s > %s for: %s', date, now, token.root)
            if (date > now) {
              logger.debug('︻デ┳═ー killer', kill)
              clearTimeout(t)
              endFn()
              messageService.removeListener(kill, killer)
            }
          }
          logger.silly('¢¢¢¢¢¢ listening for', kill)
          messageService.on(kill, killer)
          emitter.on('close', function () {
            messageService.removeListener(kill, killer)
          })
        }
        // if not authenticated then no token
        if (!user) {
          cb = token
        }
        cb(null, user)
      },
      async.apply(authorize),
      function (user, cb) {
        var err = user ? null : new Error('unauthorized')
        if (err) {
          err.token = authToken
        }
        cb(err, user)
      },
      function (user, cb) {
        getSession(sessionId, function (err, session) {
          return cb(err, session, user)
        })
      }
    ], function (err, session, user) {
      if (err) {
        logger.error('connection invalid, %s: %s', err.message, err.token)
        emitter.emit(sessionId + ':' + err.message, {
          message: err.message
        })
        emitter.emit(sessionId + ':error', {
          message: err.message
        })
      }
      done(err, session, user)
    })
  },
  startListening: function (emitter, sessionId, session, user) {
    async.each(Object.keys(SocketService.agents), function (name, cb) {
      SocketService.agents[ name ](emitter, emitter, sessionId, session, user, cb)
    }, function () {
      logger.silly(sessionId + ':connected')
      emitter.emit(sessionId + ':connected')
    })
  },
  init: function (app, io) {
    SocketService.io = io
    SocketService.io.on('connection', function (conn) {
      var emitter = new events.EventEmitter()
      emitter.setMaxListeners(0)
      conn.setMaxListeners(0)
      var emit = emitter.emit
      emitter.emit = function (st, data) {
        conn.write(JSON.stringify({
          event: st,
          data: data
        }))
      }
      conn.on('close', function () {
        emit.call(emitter, 'close')
        emitter.removeAllListeners()
      })
      conn.on('data', function (message) {
        var json = JSON.parse(message)
        emit.call(emitter, json.event, json.data)
      })

      // ************
      var sessionId = conn.url.replace(new RegExp(conn.prefix + '/.*'), '$1')
      var authToken = conn.url.replace(new RegExp(conn.prefix + '/.*'), '$3')

      SocketService.onConnect(app, sessionId, authToken, emitter, function () {
        conn.end()
      }, function (err, session, user) { // eslint-disable-line handle-callback-err
        SocketService.startListening(emitter, sessionId, session, user)
      })
    })
  }
}

module.exports = SocketService
