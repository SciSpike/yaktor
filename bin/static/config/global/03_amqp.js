var logger = require('yaktor/logger')
logger.silly(__filename)
var messageService = require('yaktor/app/services/messageService')
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

module.exports = function (yaktor, cb) {
  try {
    var Amqp = require('amqp-eventemitter').AmqpEventEmitter
    var forceAmqp = yaktor.config.get('yaktor.amqp.force')
    var options = yaktor.config.get('yaktor.amqp.options')
    var amqp = new Amqp(options)
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
      if (!connected && !forceAmqp) {
        connected = true
        logger.info('amqp not ready, using local emitter instead.')
        cb()
      } else {
        logger.error(err, err.stack)
        cb(err)
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
      // TODO: else cb(err) ?
    })
  } catch (e) {
    logger.warn('not loading amqp, %s', e.stack.toString())
    cb(e)
  }
}
