var path = require('path')
var logger = require(path.join('yaktor', 'logger'))
logger.info(__filename)
var messageService = require(path.join('yaktor', 'services', 'messageService'))
var dns = require('dns')
var os = require('os')
var zmq = require('zmq')
var pub = zmq.socket('pub')
var sub = zmq.socket('sub')
var util = require('util')

var sequence = Number.MAX_SAFE_INTEGER

var EventEmitter = require('events').EventEmitter
var emitter = new EventEmitter()
emitter.setMaxListeners(0)
var oEmit = emitter.emit.bind(emitter)

module.exports = function (config, done) {
  var knownPeers = config.messaging.peers = {}
  dns.lookup(os.hostname(), function (ignoreError, myIp) {
    sub.on('message', function (foreignAddress, foreignSequence, topic, message) {
      foreignSequence = parseInt(foreignSequence, 32)
      var expectedSequence = knownPeers[foreignAddress] ++
      if (expectedSequence !== foreignSequence) {
        // TODO notify clients
        logger.error('sequence inversion: %s expected %s got %s', foreignAddress, expectedSequence, foreignSequence)
        knownPeers[foreignAddress] = foreignSequence + 1
      }
      if (!Number.isSafeInteger(knownPeers[foreignAddress])) {
        knownPeers[foreignAddress] = 0
      }
      oEmit(topic, JSON.parse(message))
    })

    var find = function () {
      dns.lookup(config.stack, { all: true }, function (ignoreError, peers) {
        var subUrl
        for (var p in peers) {
          var address = peers[p].address
          if (myIp !== address && !knownPeers.hasOwnProperty(address)) {
            knownPeers[address] = Number.MAX_SAFE_INTEGER
            subUrl = util.format(config.messaging.url, address, config.messaging.port)
            sub.subscribe(address)
            sub.connect(subUrl)
            logger.debug('messaging connected to', subUrl)
          }
        }
      })
    }
    if (config.log.level === 'silly') {
      sub.monitor(1)
      sub.on('connect', logger.silly.bind(logger, 'connect'))
      sub.on('disconnect', logger.silly.bind(logger, 'disconnect'))
    }
    find()
    setInterval(find, config.messaging.updateIntervalMillis)
    emitter.emit = function (topic, message) {
      pub.send([myIp, (sequence++).toString(32), topic, JSON.stringify(message)])
      if (!Number.isSafeInteger(sequence)) {
        sequence = 0
      }
      oEmit(topic, message)
    }
    messageService.emitter = emitter
    var pubUrl = util.format(config.messaging.url, myIp, config.messaging.port)
    pub.bind(pubUrl, done)
    logger.debug('messaging bound to', pubUrl)
  })
}
