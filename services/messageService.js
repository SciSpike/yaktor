var logger = require('../logger')
var events = require('events')

var emitter = {}

Object.defineProperty(emitter, 'emitter', {
  configurable: false,
  set: function (newE) {
    emitter.e = newE
    emitter.e.setMaxListeners(0)
    emitter.e.on('error', function (err) {
      logger.error(err, new Error(err.stack).stack)
    })
  },
  get: function () {
    throw new Error('no getter for this property')
  }
})

// wire up the default emitter
emitter.emitter = new events.EventEmitter()
var setP = function (p) {
  emitter[ p ] = function () {
    return emitter.e[ p ].apply(emitter.e, arguments)
  }
}

// wire up all methods on emitter
for (var p in events.EventEmitter.prototype) {
  setP(p)
}

module.exports = emitter
