var logger = require('yaktor/lib/logger')
logger.silly(__filename)
var session = require('express-session')
var maxSessionAge

var MongooseStore = function (session) {
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

var SessionMongoose = MongooseStore(session)
var mongooseSessionStore = new SessionMongoose()
var secret
var initialized = false

module.exports = function () {
  if (initialized) return
  var app = this
  var yaktor = app.yaktor
  var cfg = app.get('serverConfig')

  maxSessionAge = parseInt(cfg.session.maxAgeMillis)

  yaktor.sessionStore = mongooseSessionStore
  secret = cfg.session.secret
  var sessionConfig = {
    resave: true,
    saveUninitialized: true,
    store: mongooseSessionStore,
    secret: secret,
    key: 'connect.sid',
    cookie: { httpOnly: false, maxAge: maxSessionAge }
  }
  app.set('sessionStore', mongooseSessionStore)
  app.getSession = function (sessionId, cb) {
    var sessionStore = mongooseSessionStore
    sessionStore.get(sessionId, function (err, sessionData) {
      if (err != null || !sessionData) {
        if (err) {
          logger.error(err.stack)
        }
        err = new Error('connection invalid, ' + sessionId + ': missing session')
        return cb(err)
      } else if (sessionData) {
        var session = sessionStore.createSession({
          sessionStore: app.sessionStore
        }, sessionData)
        cb(null, session)
      }
    })
  }
  app.use(require('cookie-parser')(secret))
  app.use(session(sessionConfig))

  initialized = true
}
