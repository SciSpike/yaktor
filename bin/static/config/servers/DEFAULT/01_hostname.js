var logger = require('yaktor/logger')
logger.info(__filename)

module.exports = function (ctx, done) {
  // protocol+prefix supercedes protocol+hostname+port
  var protocol = ctx.host.protocol
  var prefix = ctx.host.prefix
  if (prefix) {
    ctx.urlPrefix = protocol + '://' + prefix
  } else {
    var hostname = ctx.host.hostname
    var port = parseInt(ctx.host.port)
    ctx.urlPrefix =
      protocol +
      '://' +
      hostname +
      ((protocol === 'http' && port === 80) || (protocol === 'https' && port === 443) ? '' : (':' + port))
  }

  done()
}
