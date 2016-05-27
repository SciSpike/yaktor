var path = require('path')
var logger = require(path.resolve('node_modules/conversation/lib/logger'))
logger.silly(__filename)
module.exports = function () {
  /* global process */
  if (process.env.URL_PREFIX) {
    return this.set('urlPrefix', this.get('protocol') + '://' + process.env.URL_PREFIX)
  }
  var hostname = process.env.SUB_DOMAIN || 'localhost'
  var port = this.get('port')
  // eslint-disable-next-line eqeqeq
  this.set('urlPrefix', this.get('protocol') + '://' + hostname + ((port == 80 || port == 443) ? '' : ':' + port))
}
