var events = require('events')
var localEmitter = new (events.EventEmitter)()

localEmitter.setMaxListeners(0)

module.exports = localEmitter
