var path = require('path')
var socketService = require(path.join('../', 'app', 'services', 'socketService'))
var uuid = require('node-uuid')
var events = require('events')
var noop = function () {} // eslint-disable-line no-unused-vars
var watches = new events.EventEmitter()
var watch = function (hash, prop) {
  hash[ 'watched-' + prop ] = hash[ prop ]
  try {
    Object.defineProperty(hash, prop, {
      get: function () {
        return hash[ 'watched-' + prop ]
      },
      set: function (newValue) {
        hash[ 'watched-' + prop ] = newValue
        watches.emit(prop, newValue)
        return newValue
      },
      enumerable: true,
      configurable: false
    })
  } catch (e) {}
}
module.exports = function (agentName, initData, sessionId, session, user) {
  var socket = new events.EventEmitter()
  var isConnecting = false
  var isConnected = false
  var doConnect = function (fn, cb) {
    fn(socket, socket, sessionId, session, user, function () {
      isConnected = true
      // XXX shhhhh, keep this to yourself
      socket.emit('__connected__')
      cb()
    })
  }
  if (!sessionId) {
    sessionId = uuid()
  }
  if (!user) {
    user = {}
  }
  if (!session) {
    session = {}
  }
  var connect = this.connect = function (cb) {
    if (isConnected) {
      cb()
    } else if (isConnecting) {
      socket.once('__connected__', cb)
    } else if (socketService.agents[ agentName ]) {
      isConnecting = true
      doConnect(socketService.agents[ agentName ], cb)
    } else {
      isConnecting = true
      // Listen for the value to be set
      watches.once(agentName, function () {
        doConnect(socketService.agents[ agentName ], cb)
      })
      watch(socketService.agents, agentName)
    }
  }
  this.once = function (event, cb) {
    socket.once(agentName + ':state:' + event + ':' + initData._id, cb)
  }
  this.on = function (event, cb) {
    socket.on(agentName + ':state:' + event + ':' + initData._id, cb)
  }
  this.onError = function (cb) {
    socket.on(agentName + '::error', cb)
  }
  this.send = this.emit = function (event, data) {
    connect(function () {
      socket.emit(agentName + '::' + event, {
        agentData: initData,
        data: data
      })
    })
  }
  this.init = function () {
    connect(function () {
      socket.emit(agentName + '::init', initData)
    })
  }
  this.close = function () {
    socket.emit('close')
  }
}
