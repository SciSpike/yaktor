var logger = require('yaktor/logger')
logger.silly(__filename)

module.exports = function (serverName, app, done) {
  var socketService = require('yaktor/app/services/socketService.js')
  logger.info('init socketService')
  socketService.init(app, app.io)

  done && done()
}
