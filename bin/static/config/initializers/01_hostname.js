var config = require('config')
var logger = require('yaktor/lib/logger')
logger.silly(__filename)

module.exports = function () {
  var app = this
  var serverConfig = app.get('serverConfig')

  // prefix supercedes hostname/port/protocol
  var prefix = serverConfig.prefix
  if (prefix) {
    return app.set('urlPrefix', serverConfig.protocol + '://' + prefix)
  }
  var hostname = serverConfig.hostname
  var port = parseInt(serverConfig.port)
  app.set('urlPrefix', serverConfig.protocol + '://' + hostname + ((port === 80 || port === 443) ? '' : ':' + port))
}
