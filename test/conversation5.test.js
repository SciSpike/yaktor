/* global describe, it, beforeEach */
var path = require('path')
var assert = require('assert')
var util = require('util')
var clone = function (thing) {
  return util._extend({}, thing)
}
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

var testConversation = proxyquire(path.resolve('conversations', 'js', 'test5'), proxy)
var conversationInitializer = proxyquire(path.resolve('engine', 'conversationInitializer'), proxy)
var Agent = proxyquire(path.resolve('lib', 'agent'), proxy)

var controlId = 'controlId'
var objId = 'objdId'

var controlAgentType = testConversation.agents[ 'test5.control' ]
var objAgentType = testConversation.agents[ 'test5.obj' ]
var otherAgentType = testConversation.agents[ 'test5.other' ]

controlAgentType.states.null.transitions[ 'obj.sync' ].handler = function (causedByEventName, meta, data, done) {
  // console.log("control in null transition to controlling: ", JSON.stringify(data))
  assert.ok(!data.running)
  assert.equal(data.null_signal, 'null_signal')
  done(null, data)
}
controlAgentType.states.controlling.on = function (meta, data, done) {
  data = clone(data)
  data.obj = objId
  data.controlling = 'controlling'
  done(null, data, 'stop')
}
controlAgentType.states.controlling.transitions[ 'stop' ].handler = function (causedByEventName, meta, data, done) {
  assert.ok(!data.running)
  data = clone(data)
  assert.equal(data.controlling, 'controlling')
  data.controlling_stop = 'controlling_stop'
  done(null, data)
}
controlAgentType.states.stopping.on = function (meta, data, done) {
  data = clone(data)
  assert.equal(data.controlling, 'controlling')
  assert.equal(data.controlling_stop, 'controlling_stop')
  data.stopping = 'stopping'
  done(null, data, 'stop')
}
controlAgentType.states.stopping.transitions[ 'stop' ].handler = function (causedByEventName, meta, data, done) {
  data = clone(data)
  assert.equal(data.controlling, 'controlling')
  assert.equal(data.controlling_stop, 'controlling_stop')
  assert.equal(data.stopping, 'stopping')
  data.stopping_stop = 'stopping_stop'
  done(null, data)
}

objAgentType.states.null.transitions[ 'signal' ].handler = function (causedByEventName, meta, data, done) {
  data = clone(data)
  data.null_signal = 'null_signal'
  done(null, data)
}
objAgentType.states.running.on = function (meta, data, done) {
  assert.equal(data.null_signal, 'null_signal')
  data = clone(data)
  data.running = 'running'
  done(null, data)
}
objAgentType.states.running.transitions[ 'stop' ].handler = function (causedByEventName, meta, data, done) {
  data = clone(data)
  assert.equal(data.controlling, 'controlling')
  assert.equal(data.controlling_stop, 'controlling_stop')
  assert.equal(data.stopping, 'stopping')
  assert.equal(data.stopping_stop, 'stopping_stop')
  data.running_stop = 'running_stop'
  done(null, data)
}

describe('conversation5', function () {
  beforeEach(function () {
    mockgoose.reset()
    conversationInitializer(testConversation)
    yaktor.auth.agentAuthorize = null
  })

  it('should pass the data through a custom decision', function (done) {
    var obj = new Agent('test5.obj', {
      _id: objId
    })

    var control = new Agent('test5.control', {
      _id: controlId
    })

    var other = new Agent('test5.other', {
      _id: objId
    })

    var i = 0

    otherAgentType.states.first.transitions[ 'control.stopping' ].handler = function (causedByEventName, meta, data, done) {
      i++
      assert.ok(!data.running)
      done(null, data)
    }

    obj.once('null', function () {
      // console.log("obj in null sends signal")
      obj.emit('signal', { control: controlId })
    })
    obj.once('running', function (data) {
      // console.log("obj in running with ",JSON.stringify(data))
      assert.equal(data.running, 'running')
      assert.equal(data.null_signal, 'null_signal')
      assert.equal(0, i++)
    })
    obj.once('terminated', function (data) {
      // console.log("once terminated")
      assert.equal(i, 3)
      assert.equal(data.controlling, 'controlling')
      assert.equal(data.controlling_stop, 'controlling_stop')
      assert.equal(data.stopping, 'stopping')
      assert.equal(data.stopping_stop, 'stopping_stop')
      assert.equal(data.running_stop, 'running_stop')
      done()
    })
    control.once('controlling', function (data) {
      // console.log("once controlling")
      assert.ok(!data.running)
      assert.equal(data.null_signal, 'null_signal')
    })
    control.once('end', function (data) {
      // console.log("once end")
      assert.equal(data.controlling, 'controlling')
      assert.equal(data.controlling_stop, 'controlling_stop')
      assert.equal(data.stopping, 'stopping')
      assert.equal(data.stopping_stop, 'stopping_stop')
      assert.equal(2, i++)
    })
    obj.init()
    control.init()
    other.init()
  })
})
