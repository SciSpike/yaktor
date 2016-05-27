var path = require('path')
var logger = require(path.resolve('node_modules/conversation/lib/logger'))

logger.silly(__filename)

module.exports = function () {
  var socketService = require(path.resolve('node_modules/conversation/app/services/socketService.js'))
  logger.info('init socketService')
  socketService.init(this, this.io)
}
