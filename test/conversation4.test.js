/* global describe, it, beforeEach */
var path = require('path')
var assert = require('assert')
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

var testConversation = proxyquire(path.resolve('conversations', 'js', 'test4'), proxy)
var conversationInitializer = proxyquire(path.resolve('engine', 'conversationInitializer'), proxy)
var Agent = proxyquire(path.resolve('lib', 'agent'), proxy)

var controlId = 'controlId'
var objId = 'objdId'

describe('conversation4', function () {
  beforeEach(function () {
    mockgoose.reset()
    conversationInitializer(testConversation)
    yaktor.auth.agentAuthorize = null
  })

  it('should pass the data through both decisions', function (done, undef) {
    var obj = new Agent('test4.obj', {
      _id: objId
    })

    var control = new Agent('test4.control', {
      _id: controlId
    })

    var i = 0

    obj.once('null', function () {
      // console.log("once null sends signal")
      obj.emit('signal', { control: controlId, obj: objId })
    })
    obj.once('running', function (data) {
      // console.log("once running with",JSON.stringify(data))
      i++
    })
    obj.once('terminated', function () {
      // console.log("once terminated")
      assert.equal(i, 1)
      done()
    })
    obj.init()
    control.init()
  })
})
