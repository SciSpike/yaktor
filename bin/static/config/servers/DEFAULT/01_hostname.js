var logger = require('yaktor/lib/logger')
logger.silly(__filename)

module.exports = function (serverName, app, done) {
  // protocol+prefix supercedes protocol+hostname+port
  var protocol = app.getConfigVal('host.protocol')
  var prefix = app.getConfigVal('host.prefix')
  if (prefix) {
    app.set('urlPrefix', protocol + '://' + prefix)
  } else {
    var hostname = app.getConfigVal('host.hostname')
    var port = parseInt(app.getConfigVal('host.port'))
    app.set('urlPrefix',
      protocol +
      '://' +
      hostname +
      ((protocol === 'http' && port === 80) || (protocol === 'https' && port === 443) ? '' : (':' + port)))
  }

  done && done()
}
