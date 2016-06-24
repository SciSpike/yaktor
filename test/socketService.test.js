/* global describe, it */
process.env.NODE_CONFIG = JSON.stringify({
  yaktor: {
    log: {
      stdout: true,
      level: 'info',
      filename: ''
    }
  }
})
var proxyquire = require('proxyquire')
function Global (m) {
  m[ '@noCallThru' ] = true
  m[ '@global' ] = true
  return m
}
var yaktor = Global({
  auth: {},
  session: {}
})
var proxy = {}
proxy[ '../index' ] = yaktor
var path = require('path')
var assert = require('assert')
var events = require('events')
var socketService = proxyquire(path.resolve('services', 'socketService'), proxy)
var sessionId = 'session'
var token = "tok'n"
var io = new events.EventEmitter()
var conn = new events.EventEmitter()
var info = { scope: '*' }
conn.url = '/ws/' + sessionId + '/auth/' + token + '/d'
conn.prefix = '/ws/([^/.]+)(/auth/([^/.]+)){0,1}'

describe('socketService', function () {
  it('should default auth on connection no session', function (done) {
    socketService.onConnect(sessionId, token, io, function () {}, function (err, s, u) {
      assert.ifError(err)
      assert.deepEqual(s, {})
      assert.ok(u)
      io.once(sessionId + ':connected', done)
      socketService.startListening(io, sessionId, s, u)
    })
  })

  it('should default auth on connection', function (done) {
    var i = 0
    yaktor.session.getSession = function (theirSessionId, cb) {
      i++
      assert.equal(theirSessionId, sessionId)
      cb(null, {})
    }
    socketService.onConnect(sessionId, token, io, function () {}, function (err, s, u) {
      assert.ifError(err)
      assert.deepEqual(s, {})
      assert.ok(u)
      assert.equal(i, 1)
      io.once(sessionId + ':connected', done)
      socketService.startListening(io, sessionId, s, u)
    })
  })

  it('should try to authorize on connection', function (done) {
    var i = 0
    var user = {}
    yaktor.auth.tokenAuthenticate = function (t, cb) {
      i++
      assert.equal(t, token)
      cb(null, user, info, null)
    }
    yaktor.auth.authorize = function (a, cb) {
      i++
      assert.equal(a, user)
      cb(null, user)
    }
    yaktor.session.getSession = function (theirSessionId, cb) {
      i++
      assert.equal(theirSessionId, sessionId)
      cb(null, {})
    }
    socketService.onConnect(sessionId, token, io, function () {}, function (err, s, u) {
      assert.ifError(err)
      assert.deepEqual(s, {})
      assert.equal(u, user)
      assert.equal(i, 3)
      io.once(sessionId + ':connected', done)
      socketService.startListening(io, sessionId, s, u)
    })
  })
})
