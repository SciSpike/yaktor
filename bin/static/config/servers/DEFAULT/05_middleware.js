var logger = require('yaktor/logger')
logger.info(__filename)
var path = require('path')
var bodyParser = require('body-parser')
var fs = require('fs')
var url = require('url')

// Endpoints
module.exports = function (serverName, app, done) {
  var favicon = path.resolve(path.join(app.getConfigVal('favicon.basedir'), app.getConfigVal('favicon.filename')))
  fs.exists(favicon, function (exists) {
    if (exists) {
      app.use(require('serve-favicon')(favicon))
    }
  })
  // TODO: make morgan configurable?
  app.use(require('morgan')({ stream: { write: function (log) { logger.silly(log) } } }))
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(function (req, res, next) {
    /* global process */
    var method = req.method && req.method.toUpperCase && req.method.toUpperCase()
    var referer = req.headers.referer
    var refHost = req.headers.host
    var hostname = req.hostname
    if (referer) {
      referer = referer.hostname ? referer : url.parse(referer)
      refHost = referer.href.replace(new RegExp(referer.path + '$'), '')
      hostname = referer.hostname
    }
    // we allow you as long as you match
    var allowedOrigin = new RegExp((process.env.DOMAIN || '') + '$').test(hostname) ? refHost : app.get('urlPrefix')
    res.header('Access-Control-Allow-Origin', allowedOrigin)
    res.header('Access-Control-Allow-Credentials', 'true')
    // * might not be doing what is expected so drop this one.
    // res.header('Access-Control-Expose-Headers','*')
    if (method === 'OPTIONS') {
      res.header('Access-Control-Max-Age', '86400')
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, HEAD, OPTIONS')
      // * isn't working as expected so add some more :)
      res.header('Access-Control-Allow-Headers', '*,Authorization,Content-Type,Accept,Origin,User-Agent,DNT,Cache-Control,X-Mx-ReqToken,Keep-Alive,X-Requested-With,If-Modified-Since,' + Object.keys(req.headers).join(','))
      res.statusCode = 204
      res.end()
    } else {
      next()
    }
  })

  app.use(require('connect-flash')())
  app.use(require('method-override')())

  app.use(function (req, res, next) {
    if (!req.urlPrefix) {
      req.urlPrefix = app.get('urlPrefix')
    }
    return next()
  })
  app.use(function (req, res, next) {
    res.locals.user = req.user
    res.locals.authenticated = !(req.user && req.user.anonymous)
    next()
  })

  done && done()
}
