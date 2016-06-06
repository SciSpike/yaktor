var logger = require('yaktor/lib/logger')
logger.silly(__filename)

module.exports = function () {
  /* global process */
  if (process.env.URL_PREFIX) {
    return this.set('urlPrefix', this.get('protocol') + '://' + process.env.URL_PREFIX)
  }
  var hostname = process.env.SUB_DOMAIN || 'localhost'
  var port = parseInt(this.get('port'))
  this.set('urlPrefix', this.get('protocol') + '://' + hostname + ((port === 80 || port === 443) ? '' : ':' + port))
}
