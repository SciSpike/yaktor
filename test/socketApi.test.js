/* global describe, it, beforeEach */
process.env.NODE_CONFIG = JSON.stringify({
  yaktor: {
    log: {
      stdout: true,
      level: 'info',
      filename: ''
    }
  }
})
var path = require('path')
var assert = require('assert')
var async = require('async')
require('mongoose-shortid')
var logger = require('../logger')
require(path.resolve('src-gen', 'test'))
var mongoose = require('mongoose')
var mockgoose = require('mockgoose')
var proxyquire = require('proxyquire')
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
  logger: logger
})

var fakeWs = {}
events.EventEmitter.defaultMaxListeners = 0
var proxy = {
  'emitter-component': Global(events.EventEmitter),
  'yaktor': yaktor,
  'mongoose': Global(mongoose),
  '../index': yaktor,
  '../logger': logger,
  '../app/services/socketService': socketService,
  '../app/services/messageService': messageService,
  'sockjs-client-ws': Global(fakeWs)
}

proxy[ path.resolve('node_modules', 'mongoose') ] = proxy.mongoose

var socketApi = proxyquire(path.resolve(path.resolve('bin', 'static', 'public', 'socketApi')), proxy)
var testConversation = proxyquire(path.resolve('conversations', 'js', 'test4'), proxy)
var conversationInitializer = proxyquire(path.resolve('engine', 'conversationInitializer'), proxy)

describe('socketApi', function () {
  beforeEach(function () {
    mockgoose.reset()
    conversationInitializer(testConversation)
    yaktor.agentAuthorize = null
  })

  it('should be able to [dis]connect multiple times', function (done) {
    var i = 0
    var j = 5
    var k = 0
    var sessionId = 'sessionId'

    fakeWs.create = function () {
      var ws = new events.EventEmitter()
      ws.close = function () {
        k++
      }
      var on = ws.on
      ws.on = function () {
        on.apply(this, arguments)
        if (arguments[ 0 ] === 'data') {
          ws.emit('data', JSON.stringify({
            event: sessionId + ':connected'
          }))
        }
      }
      return ws
    }
    async.times(j, function (n, cb) {
      socketApi.connect(sessionId, function (cb) {
        cb()
      }, false, function (ws) {
        i++
        ws.emit('data', JSON.stringify({
          event: sessionId + ':connected'
        }))
        ws.emit('close', ':)')
        cb()
      })
    }, function (err) {
      assert.ifError(err)
      assert.equal(j, i)
      assert.equal(k, Math.floor(j / 2))
      done()
    })
  })
})
