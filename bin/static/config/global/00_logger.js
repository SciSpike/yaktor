var logger = require('yaktor/logger')
require('colors')
module.exports = function (yaktor, done) {
  logger.yaktorInit(yaktor)
  logger.info(__filename)
  process.on('uncaughtException', function (err) {
    logger.error('uncaught exception', err, err.stack)
  })
  done()
}
