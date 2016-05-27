/* global describe, it, beforeEach */
var path = require('path')
require('mongoose-shortid')
var Promise = require('bluebird')
var logger = require('../lib/logger')
logger.init({
  get: function () {}
})
require(path.resolve('src-gen', 'test'))
var mongoose = require('mongoose')
var mockgoose = require('mockgoose')
var proxyquire = require('proxyquire')
mockgoose(mongoose)
mongoose.connect('mongodb://localhost:27017/TestingDB')

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
var proxy = {
  'yaktor': yaktor,
  'mongoose': Global(mongoose),
  '../index': yaktor,
  '../lib/logger': logger,
  '../app/services/socketService': socketService,
  '../app/services/messageService': messageService
}
proxy[ path.resolve('node_modules', 'mongoose') ] = proxy.mongoose

var testConversation = proxyquire(path.resolve('conversations', 'js', 'test6'), proxy)
var conversationInitializer = proxyquire(path.resolve('engine', 'conversationInitializer'), proxy)
var Agent = proxyquire(path.resolve('lib', 'agent'), proxy)

var aId = 'aId'
var bId = 'bId'

/* eslint-disable promise/param-names */

describe(path.basename(__filename), function () {
  beforeEach(function () {
    mockgoose.reset()
    conversationInitializer(testConversation)
    yaktor.agentAuthorize = null
  })
  it('should pass the data through', function (done) {
    var a = new Agent('test6.a', {
      _id: aId
    })

    var b = new Agent('test6.b', {
      _id: bId
    })

    var contract = { aId: aId, bId: bId, id: 'contractId' }
    var p1 = new Promise(function (done) {
      a.once('stopped', function () {
        a.emit('start', contract)
        a.once('stopped', done)
      })
    })
    var p2 = new Promise(function (done) {
      b.once('stopped', function () {
        b.once('stopped', done)
      })
    })
    Promise.all([ p1, p2 ]).asCallback(done)

    a.once('started', function () {
      a.emit('stop', contract)
    })
    var sP = new Promise(function (done) {
      b.once('starting', function () {
        b.emit('accept', contract)
        done()
      })
    })
    a.once('starting', function () {
      a.emit('accept', contract)
      sP.then(function () {
        a.emit('stop', contract)
      })
    })
    testConversation.agents[ 'test6.contract' ].states.staged.on = function (meta, data, done) {
      var results = { 'start': 'start', 'stop': 'stop' }
      sP.delay(100).then(function () {
        done.bind(null, null, data, results.start)
      })
    }
    a.init()
    b.init()
  })
})
