var logger = require('yaktor/lib/logger')
logger.silly(__filename)

var settings = {
  caseSensitiveRouting: 'case sensitive routing',
  etag: 'etag',
  jsonpCallbackName: 'jsonp callback name',
  jsonReplacer: 'json replacer',
  jsonSpaces: 'json spaces',
  queryParser: 'query parser',
  stringRouting: 'string routing',
  subdomainOffset: 'subdomain offset',
  trustProxy: 'trust proxy',
  views: 'views',
  viewCache: 'view cache',
  viewEngine: 'view engine',
  xPoweredBy: 'x-powered-by'
}

module.exports = function (serverName, app, done) {
  Object.keys(settings).forEach(function (setting) {
    var val = val = app.getConfigVal(setting)
    if (val !== null) app.set(settings[ setting ], val)
  })
  
  done && done()
}
