var logger = require('yaktor/logger')
logger.info(__filename)
var dns = require('dns')
var os = require('os')

module.exports = function (ctx, done) {
  var port = ctx.host.port
  var i = parseInt(port)
  if (port.toString() !== i.toString()) return done(new Error('server %s setting host.port is not an integer', ctx.serverName))
  port = i

  ctx.server.listen(port, function (err) {
    if (err) return done(err)
    dns.lookup(os.hostname(), function (err, ip) { // eslint-disable-line handle-callback-err
      logger.info('server %s listening at %s ip % ', ctx.serverName, ctx.urlPrefix, ip)
      done()
    })
  })
}
