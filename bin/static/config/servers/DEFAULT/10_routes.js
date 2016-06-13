var logger = require('yaktor/logger')
logger.silly(__filename)
var path = require('path')
var fs = require('fs')

module.exports = function (serverName, app, done) {
  var routes = path.resolve(app.hasConfigVal('routesPath')
    ? app.getConfigVal('routesPath')
    : path.join('routes', serverName))

  if (fs.existsSync(routes)) {
    fs.readdirSync(routes).forEach(function (file) {
      var item = path.join(routes, file)
      require(item)(app)
    })
  }

  done && done()
}
