var logger = require('yaktor/logger')
logger.info(__filename)
var session = require('express-session')
var maxSessionAge

var MongooseSessionStoreFactory = function (session) {
  var Store = session.Store

  function SessionStore (options) {
    Store.call(this, options)
    options = options || {}
    maxSessionAge = options.maxSessionAge || maxSessionAge

    this.model = require('mongoose').model('Session')
  }

  SessionStore.prototype = Object.create(Store.prototype)

  SessionStore.prototype.get = function (sid, cb) {
    return this.model.findOne({
      _id: sid
    }, function (err, session) {
      var data
      if (err || !session) {
        return cb(err)
      } else {
        data = session.data
        try {
          if (typeof data === 'string') {
            data = JSON.parse(data)
          }
          return cb(null, data)
        } catch (err) {
          return cb(err)
        }
      }
    })
  }

  SessionStore.prototype.set = function (sid, data, cb) {
    var expires
    var session
    if (!data) {
      return this.destroy(sid, cb)
    } else {
      try {
        if (data.cookie) {
          var maxAge = data.cookie.maxAge || maxSessionAge
          expires = data.cookie.expires || new Date(new Date().getTime() + maxAge)
        }
        session = {
          sid: sid,
          data: data,
          expires: expires
        }
        return this.model.update({
          _id: sid
        }, session, {
          upsert: true
        }, cb)
      } catch (err) {
        return cb(err)
      }
    }
  }

  SessionStore.prototype.destroy = function (sid, cb) {
    return this.model.remove({
      _id: sid
    }, cb)
  }

  SessionStore.prototype.clear = function (cb) {
    return this.model.collection.drop(cb)
  }

  SessionStore.prototype.length = function (cb) {
    return this.model.count({}, cb)
  }

  return SessionStore
}

var MongooseSessionStore = MongooseSessionStoreFactory(session)

module.exports = function (yaktor, done) {
  if (!yaktor.session.enable) {
    // this is like removing this file
    return done()
  }

  var sessionStore = yaktor.session.config.store = new MongooseSessionStore()
  yaktor.session.getSession = function (sessionId, cb) {
    sessionStore.get(sessionId, function (err, sessionData) {
      if (err != null || !sessionData) {
        if (err) {
          logger.error(err.stack)
        }
        err = new Error('connection invalid, ' + sessionId + ': missing session')
        return cb(err)
      } else if (sessionData) {
        // create a fake request object with a sessionStore in order to create a session instance
        var session = sessionStore.createSession({
          sessionStore: sessionStore
        }, sessionData)
        cb(null, session)
      }
    })
  }

  done()
}
