var winston = require('winston')
var winstonCommon = require('winston/lib/winston/common')
var logger = new (winston.Logger)({
  transports: [], exitOnError: false
})

var isInit = false

logger.init = function (app) {
  if (!isInit) {
    isInit = true
    var port = (app && app.get) ? ':' + app.get('port') : ''
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
      if (process.env.LOG_FILE) {
        logger.info('Rotate logs.')
        logger.transports[ winston.transports.File.prototype.name ].reopen(function () {
          logger.info('Done rotating.')
        })
      }
    })
    var myLevel = process.env.LOG_LEVEL || 'info'
    if (process.env.LOG_FILE) {
      logger.add(winston.transports.File, {
        level: myLevel,
        colorize: true,
        timestamp: true,
        json: false,
        filename: process.env.LOG_FILE
      })
    } else {
      logger.add(winston.transports.Console, {
        level: myLevel,
        colorize: true,
        timestamp: function () { return new Date().toISOString() + port }
      })
    }
    logger.setLevels(logger.levels)
  }
}
module.exports = logger
