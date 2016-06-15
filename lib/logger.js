var config = require('config')
var winston = require('winston')
var winstonCommon = require('winston/lib/winston/common')
var logger = new (winston.Logger)({
  transports: [], exitOnError: false
})

winstonCommon.setLevels = function (target) {
  Object.keys(target.levels).forEach(function (level) {
    target[ level ] = function () {
      var args = Array.prototype.slice.call(arguments)
      args.splice(0, 0, level)
      // console.log.apply(console,arguments)
      target.log.apply(target, args)
    }
  })
}
winston.transports.File.prototype.reopen = function (callback) {
  if (this.opening) {
    //
    // If we are already attempting to open the next
    // available file then respond with a value indicating
    // that the message should be buffered.
    //
    return callback(true)
  } else {
    //
    // If we don't have a stream or have exceeded our size, then create
    // the next stream and respond with a value indicating that
    // the message should be buffered.
    //
    this._createStream()
    return callback(true)
  }
}
process.on('SIGHUP', function () {
  logger.info('caught SIGHUP')
  if (config.has('yaktor.log.filename') && config.get('yaktor.log.filename')) {
    logger.info('rotate logs')
    logger.transports[ winston.transports.File.prototype.name ].reopen(function () {
      logger.info('done rotating')
    })
  }
})

if (config.has('yaktor.log.filename') && config.get('yaktor.log.filename')) {
  logger.add(winston.transports.File, {
    level: config.get('yaktor.log.level'),
    colorize: false,
    timestamp: true,
    json: false,
    filename: config.get('yaktor.log.filename')
  })
}
if (config.get('yaktor.log.stdout')) {
  logger.add(winston.transports.Console, {
    level: config.get('yaktor.log.level'),
    colorize: true,
    timestamp: true
  })
}
logger.setLevels(logger.levels)

logger.initialized = true

module.exports = logger
