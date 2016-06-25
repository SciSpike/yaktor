var logger = require('yaktor/logger')
logger.info(__filename)
var session = require('express-session')

module.exports = function (ctx, done) {
  if (!ctx.session.enable) return done()

  var app = ctx.app
  app.use(require('cookie-parser')(ctx.session.config.secret))
  app.use(session(ctx.session.config))

  done()
}
