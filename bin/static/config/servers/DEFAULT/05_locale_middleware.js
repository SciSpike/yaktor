var logger = require('yaktor/logger')
logger.info(__filename)
var locale = require('locale')

module.exports = function (serverName, app, done) {
  app.use(locale(app.getConfigVal('i18n.locales')))
  done && done()
}
