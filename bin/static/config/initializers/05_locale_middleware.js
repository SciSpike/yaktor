var logger = require('yaktor/lib/logger')
logger.silly(__filename)
var locale = require('locale')
var fs = require('fs')

module.exports = function (done) {
  var app = this
  var cfg = app.get('serverConfig')

  var locales = cfg.locales
  app.use(locale(locales))
  done()
}
