var path = require('path')
var fs = require('fs')
var logger = require(path.resolve('node_modules/conversation/lib/logger'))

logger.silly(__filename)

module.exports = function () {
  var app = this
  var routes = app.get('routesPath')
  if (fs.existsSync(routes)) {
    fs.readdirSync(routes).forEach(function (file) {
      var item = path.join(routes, file)
      require(item)(app)
    })
  }
}
