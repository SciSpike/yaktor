var path = require('path')
var logger = require(path.resolve('node_modules/conversation/lib/logger'))
var auditLogger = require(path.resolve('node_modules/conversation/lib/auditLogger'))
logger.silly(__filename)

var log = function (req, res) {
  auditLogger.web(req._parsedUrl.pathname, req.user, new Date(), req.method, JSON
    .stringify(req.query), JSON.stringify(req.body), JSON
    .stringify(req.headers), res.statusCode)
}

module.exports = function () {
  var app = this
  app.use(function logger (req, res, next) {
    var resHandler = function () {
      res.removeListener('finish', resHandler)
      res.removeListener('close', resHandler)
      log(req, res)
    }

    res.on('finish', resHandler)
    res.on('close', resHandler)

    next()
  })
}
