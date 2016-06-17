var logger = require('yaktor/logger')
logger.info(__filename)
var auditLogger = require('yaktor/lib/auditLogger')

var log = function (req, res) {
  auditLogger.web(req._parsedUrl.pathname, req.user, new Date(), req.method, JSON
    .stringify(req.query), JSON.stringify(req.body), JSON
    .stringify(req.headers), res.statusCode)
}

module.exports = function (serverName, app, done) {
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

  done && done()
}
