var logger = require('yaktor/logger')
logger.info(__filename)
var path = require('path')
var fs = require('fs')

module.exports = function (ctx, done) {
  var routes = path.resolve(ctx.path.routesPath)

  if (fs.existsSync(routes)) {
    fs.readdirSync(routes).forEach(function (file) {
      var item = path.join(routes, file)
      require(item)(ctx)
    })
  }

  done()
}
