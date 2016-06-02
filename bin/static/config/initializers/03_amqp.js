var path = require('path')
var messageService = require(path.resolve('node_modules/conversation/app/services/messageService'))
var logger = require(path.resolve('node_modules/conversation/lib/logger'))
logger.silly(__filename)
// add the missing methods
var def = require('amqp-eventemitter/node_modules/amqp/lib/amqp-definitions-0-9-1.js')
def.classes.push({
  'name': 'access',
  'index': 30,
  'fields': [],
  methods: [
    {
      'index': 11,
      'fields': [ { 'domain': 'short', 'name': 'ticket', 'default-value': 1 } ],
      'name': 'requestOk'
    } ]
})
var definitions = require('amqp-eventemitter/node_modules/amqp/lib/definitions')
var methods = definitions.methods
var Queue = require('amqp-eventemitter/node_modules/amqp/lib/queue')
var oldOnMethod = Queue.prototype._onMethod
Queue.prototype._onMethod = function (channel, method, args) {
  if (method === methods.accessRequestOk) {
    this.emit('pong', args)
  } else {
    oldOnMethod.call(this, channel, method, args)
  }
}
Queue.prototype.ping = function (def) {
  var that = this
  var pong = function (data) {
    def(true)
  }
  this.once('pong', pong)
  this.connection.write(new Buffer([ 1, 0, this.channel, 0, 0, 0, 6, 0, 30, 0, 10, 0, 30, 206 ]), null, function (err) {
    if (err) {
      that.removeListener('pong', pong)
      def(false)
    }
  })
}

module.exports = function (cb) {
  try {
    var Amqp = require('amqp-eventemitter').AmqpEventEmitter
    var amqpHost = process.env.AMQP_HOST || 'localhost'
    var forceAmqp = process.env.FORCE_AMQP
    var amqp = new Amqp({
      connection: {
        host: amqpHost,
        port: 5672,
        heartbeat: 55
      }
    })
    var connected = false
    amqp.queue.on('amqp-eventemitter.ready', function () {
      if (!connected) {
        connected = true
        messageService.emitter = amqp
        logger.silly('amqp ready.')
        cb()
      }
    })
    amqp.queue.on('error', function (err) {
      logger.error(err, err.stack)
      if (!connected && !forceAmqp) {
        connected = true
        logger.silly('amqp not ready, using local emitter instead.')
        cb()
      }
    })
    amqp.queue.connection.on('error', function (err) {
      if (forceAmqp) {
        logger.error('amqp error', err, err.stack)
      // we need to catch this one if the server goes down unexpectedly.
      }
      if (err.code === 'EPIPE') {
        amqp.queue.connection.reconnect()
      }
    })
  } catch (e) {
    logger.silly('not loading amqp, %s', e.stack.toString())
    cb()
  }
}