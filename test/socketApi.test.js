/* global describe, it, beforeEach */
var path = require('path')
var assert = require('assert')
var async = require('async')
var proxyquire = require('proxyquire')
require('mongoose-shortid-nodeps')
require(path.resolve('src-gen', 'test'))
var mongoose = require('mongoose')
var mockgoose = require('mockgoose')
mockgoose(mongoose)
require(path.resolve('src-gen', 'modelAll'))
var events = require('events')

function Global (m) {
  m[ '@noCallThru' ] = true
  m[ '@global' ] = true
  return m
}

var messageService = Global(new events.EventEmitter())
var socketService = Global({
  agents: {}
})

var yaktor = Global({
  auth: {},
  log: {
    level: 'info',
    stdout: true,
    filename: ''
  }
})
var logger = Global(proxyquire('../logger', { '../index': yaktor }))
var fakeWs = {}
events.EventEmitter.defaultMaxListeners = 0
var proxy = {
  'emitter-component': Global(events.EventEmitter),
  'yaktor': yaktor,
  'mongoose': Global(mongoose),
  '../index': yaktor,
  '../logger': logger,
  'yaktor/logger': logger,
  '../services/socketService': socketService,
  '../services/messageService': messageService,
  'mqtt': Global(fakeWs)
}

proxy[ path.resolve('node_modules', 'mongoose') ] = proxy.mongoose

var socketApi = proxyquire(path.resolve(path.resolve('bin', 'static', 'public', 'socketApi')), proxy)
var testConversation = proxyquire(path.resolve('conversations', 'js', 'test4'), proxy)
var conversationInitializer = proxyquire(path.resolve('engine', 'conversationInitializer'), proxy)

describe('socketApi', function () {
  beforeEach(function () {
    mockgoose.reset()
    conversationInitializer(testConversation)
    yaktor.auth.agentAuthorize = null
  })
  it('should test more', function () {
    // TODO
  })
  it('should be able to [dis]connect multiple times', function (done) {
    var i = 0
    var j = 6
    var k = 0
    var sessionId = 'sessionId'

    fakeWs.connect = function () {
      var ws = new events.EventEmitter()
      ws.end = function () {
        k++
        ws.emit('close', ':)')
      }
      ws.connected = true
      ws.emit('connect')
      return ws
    }
    async.times(j, function (n, cb) {
      var prefix = 'http://localhost:3000'
      var client = socketApi.connectWithPrefix(prefix, sessionId, function (cb) {
        cb()
      }, false)
      client.on('close', function () {
        cb()
      })
      var connected = function () {
        i++
        if (n % 2) {
          socketApi.disconnect(prefix)
        }
      }
      if (client.connected) {
        connected()
      }
      client.once('connect', connected)
    }, function (err) {
      assert.ifError(err)
      assert.equal(j, i)
      assert.equal(k, Math.floor(j / 2))
      done()
    })
  })
})
