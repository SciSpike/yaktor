/* global describe, it, before */
var path = require('path')
var assert = require('assert')
var events = require('events')
var socketService = require(path.resolve('app', 'services', 'socketService'))
var app = {
  yaktor: {},
  sessionStore: {
    get: function (sessionId, cb) {
      cb(null, { sessionId: sessionId })
    },
    createSession: null
  },
  get: function (p) {
    return app[ p ]
  }
}
var sessionId = 'session'
var token = "tok'n"
var io = new events.EventEmitter()
var conn = new events.EventEmitter()
var info = { scope: '*' }
conn.url = '/ws/' + sessionId + '/auth/' + token + '/d'
conn.prefix = '/ws/([^/.]+)(/auth/([^/.]+)){0,1}'

describe('socketService', function () {
  before('it takes an emitter and a fake app to set up', function (done) {
    socketService.init(app, io)
    done()
  })
  it('should try to authorize on connection', function (done) {
    var i = 0
    var user = {}
    app.yaktor.tokenAuthenticate = function (t, cb) {
      i++
      assert.equal(t, token)
      cb(null, user, info, null)
    }
    app.yaktor.authorize = function (a, cb) {
      i++
      assert.equal(a, user)
      cb(null, user)
    }
    app.yaktor.getSession = function (theirSessionId, cb) {
      i++
      assert.equal(theirSessionId, sessionId)
      cb(null, {})
    }
    conn.write = function (str) {
      var data = JSON.parse(str)
      assert.equal(i, 3)
      assert.equal(data.event, 'session:connected')
      done()
    }
    io.emit('connection', conn)
  })
  it('should default auth on connection', function (done) {
    var i = 0
    app.yaktor.getSession = function (theirSessionId, cb) {
      i++
      assert.equal(theirSessionId, sessionId)
      cb(null, {})
    }
    conn.write = function (str) {
      var data = JSON.parse(str)
      assert.equal(i, 1)
      assert.equal(data.event, 'session:connected')
      done()
    }
    io.emit('connection', conn)
  })
})
