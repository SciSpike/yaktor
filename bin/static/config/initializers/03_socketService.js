var logger = require('yaktor/lib/logger')
logger.silly(__filename)
var path = require('path')

module.exports = function () {
  var socketService = require('yaktor/app/services/socketService.js')
  logger.info('init socketService')
  socketService.init(this, this.io)
}
