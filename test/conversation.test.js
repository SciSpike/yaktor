/* global describe, it, before */
var path = require('path')
var assert = require('assert')
var async = require('async')
require('mongoose-shortid')
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
var times = function (times, task, callback) {
  var count = 0
  var stop = false
  var done = 0
  var cb = function (err) {
    done++
    if (err) {
      stop = true
      callback(err, done)
    } else if (done === times) {
      callback(null, done)
    }
  }
  var pt = function () {
    if (!stop && count++ < times) {
      task(count, cb)
      process.nextTick(pt)
    }
  }
  pt()
}

var yaktor = Global({})
var proxy = {
  'yaktor': yaktor,
  'mongoose': Global(mongoose),
  '../index': yaktor,
  '../lib/logger': logger,
  '../app/services/socketService': socketService,
  '../app/services/messageService': messageService
}
proxy[ path.resolve('node_modules', 'mongoose') ] = proxy.mongoose

var testConversation = proxyquire(path.resolve('conversations', 'js', 'test'), proxy)
var conversationInitializer = proxyquire(path.resolve('engine', 'conversationInitializer'), proxy)
var Agent = proxyquire(path.resolve('lib', 'agent'), proxy)

var agentName = 'test.test'
var agentId = 'agentId'
var user = {}
var a = new Agent('test.test', {
  _id: agentId
}, null, null, user)

// testing with two agents to make sure we don't break it.
var b = new Agent('test.test', {
  _id: 'b'
}, null, null, user)

describe('conversationInitializer', function () {
  before(function () {
    mockgoose.reset()
  })

  it('should be able to init agents', function (done) {
    async.parallel([
      async.apply(a.connect.bind(a)),
      async.apply(b.connect.bind(b))
    ], done)
    conversationInitializer(testConversation)
  })
  it('should handle a connect frenzy', function (done) {
    async.times(10,
      function (n, cb) {
        a.connect(cb)
      }, done)
  })
  it('should have registered listeners to init message', function (done) {
    var state = null
    yaktor.agentAuthorize = null
    a.connect(function () {
      a.once(state, function () {
        done()
      })
      a.init()
    })
  })
  it('should be able to jump to the new state', function (done) {
    var state = 'begun'
    yaktor.agentAuthorize = null
    a.once(state, function () {
      done()
    })
    a.send('begin', {
      garbadge: ''
    })
  })
  it('should authorize init message', function (done) {
    var state = 'begun'
    var i = 0
    yaktor.agentAuthorize = function (u, agentQName, cb) {
      i++
      assert.equal(u, user)
      assert.equal(agentQName, agentName)
      cb(null, true)
    }
    a.once(state, function () {
      assert.equal(i, 1)
      done()
    })
    a.init()
  })
  it('should not authorize init message', function (done) {
    var i = 0
    yaktor.agentAuthorize = function (u, agentQName, cb) {
      i++
      assert.equal(u, user)
      assert.equal(agentQName, agentName)
      cb(null, false)
    }
    a.onError(function (data) {
      assert.equal(i, 1)
      assert.ok(data.message)
      done()
    })
    a.init()
  })
  it('should close and then not respond to events', function (done) {
    var state = 'begun'
    yaktor.agentAuthorize = null
    a.close()
    var i = 0
    a.once(state, function () {
      i++
    })
    a.init()
    setTimeout(function () {
      assert.equal(i, 0)
      done()
    }, 1)
  })

  describe('transition', function () {
    it('should call custom code, then hit mapping logic with new data', function (done) {
      var _id = 'transition'
      var agent = testConversation.agents[ agentName ]
      var newData = {}
      var handler = agent.states.null.transitions[ 'begin' ].handler
      agent.states.null.transitions[ 'begin' ].handler = function (causedByEventName, meta, data, done) {
        done(null, newData)
      }
      var a = new Agent('test.test', {
        _id: _id
      })
      a.once('null', function () {
        a.send('begin')
      })
      a.once('begun', function (data) {
        assert.equal(data, newData)
        a.close()
        agent.states.null.transitions[ 'begin' ].handler = handler
        done()
      })
      a.init()
    })
  })

  it('should hit my messageAuth function', function (done) {
    var agent = testConversation.agents[ agentName ]
    var i = 0
    var _id = 'auth'
    var events = [ agentName + '::init', agentName + '::begin:' + _id ]
    agent.messageAuth = function (user, event, meta, reqData, cb) {
      assert.equal(event, events[ i ])
      i++
      cb(null, true)
    }
    var a = new Agent('test.test', {
      _id: _id
    })
    a.once('null', function () {
      a.send('begin')
    })
    a.once('begun', function () {
      a.close()
      assert.equal(i, 2)
      agent.messageAuth = null
      done()
    })
    a.init()
  })
  it('should be able to do many of these at once', function (done) {
    yaktor.agentAuthorize = null
    times(100, function (n, done) {
      var a = new Agent('test.test', {
        _id: 'time:' + n
      })
      a.once('begun', function () {
        a.close()
        var b = new Agent('test.test', {
          _id: 'time:' + n
        })
        b.once('end', function () {
          b.close()
          done()
        })
        b.send('end')
      })
      a.send('begin')
    }, function () {
      done()
    })
  })
})
