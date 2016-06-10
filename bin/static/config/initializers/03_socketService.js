var logger = require('yaktor/lib/logger')
logger.silly(__filename)

module.exports = function () {
  var app = this
  var socketService = require('yaktor/app/services/socketService.js')
  logger.info('init socketService')
  socketService.init(app, app.io)
}
