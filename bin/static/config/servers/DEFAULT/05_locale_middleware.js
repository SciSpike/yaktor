var logger = require('yaktor/logger')
logger.info(__filename)
var locale = require('locale')

module.exports = function (ctx, done) {
  ctx.app.use(locale(ctx.i18n.locales))
  done()
}
