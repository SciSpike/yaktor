var logger = require('yaktor/lib/logger')
logger.silly(__filename)
var path = require('path')
var fs = require('fs')

module.exports = function () {
  var app = this
  var cfg = app.get('serverConfig')
  var routes = path.resolve(cfg.routesPath)
  if (fs.existsSync(routes)) {
    fs.readdirSync(routes).forEach(function (file) {
      var item = path.join(routes, file)
      require(item)(app)
    })
  }
}
