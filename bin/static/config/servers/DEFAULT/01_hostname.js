var config = require('config')
var logger = require('yaktor/lib/logger')
logger.silly(__filename)

module.exports = function (serverName, app, done) {

  var cfg = app.getConfigVal

  // protocol+prefix supercedes protocol+hostname+port
  var prefix = cfg('prefix')
  if (prefix) {
    app.set('urlPrefix', cfg('protocol') + '://' + prefix)
  } else {
    var hostname = cfg('hostname')
    var port = parseInt(cfg('port'))
    app.set('urlPrefix', cfg('protocol') + '://' + hostname + ((port === 80 || port === 443) ? '' : ':' + port))
  }

  done && done()
}
