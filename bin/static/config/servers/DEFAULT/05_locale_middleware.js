var logger = require('yaktor/logger')
logger.silly(__filename)
var locale = require('locale')
var fs = require('fs')

module.exports = function (serverName, app, done) {
  app.use(locale(app.getConfigVal('locales')))
  done && done()
}
