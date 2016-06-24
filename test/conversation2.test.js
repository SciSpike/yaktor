/* global describe, it, before */
var path = require('path')
var assert = require('assert')
var async = require('async')
require('mongoose-shortid-nodeps')
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
  auth: {},
  log: {
    stdout: true,
    level: 'info',
    filename: ''
  }
})
var logger = Global(proxyquire('../logger', { '../index': yaktor }))
var proxy = {
  'yaktor': yaktor,
  'mongoose': Global(mongoose),
  '../index': yaktor,
  '../logger': logger,
  'yaktor/logger': logger,
  '../services/socketService': socketService,
  '../services/messageService': messageService
}
proxy[ path.resolve('node_modules', 'mongoose') ] = proxy.mongoose

var testConversation = proxyquire(path.resolve('conversations', 'js', 'test2'), proxy)
var conversationInitializer = proxyquire(path.resolve('engine', 'conversationInitializer'), proxy)
var Agent = proxyquire(path.resolve('lib', 'agent'), proxy)

var agentId = 'agentId'
var user = {}

var obj = new Agent('test2.obj', {
  _id: agentId
}, null, null, user)

var control = new Agent('test2.control', {
  _id: agentId
}, null, null, user)

describe('conversation2', function () {
  before(function () {
    mockgoose.reset()
  })
  it('should be able to init agents', function (done) {
    conversationInitializer(testConversation)
    async.parallel([
      async.apply(obj.connect.bind(obj)),
      async.apply(control.connect.bind(control))
    ], done)
  })
  it('should have registered listeners to init message', function (done) {
    var i = 0
    yaktor.auth.agentAuthorize = null
    control.once('controlling', function () {
      i++
      control.emit('stop')
    })
    obj.once('null', function () {
      i++
      obj.emit('signal')
    })
    control.once('end', function () {
      assert.equal(i, 2)
      done()
    })
    obj.init()
    control.init()
  })
})
