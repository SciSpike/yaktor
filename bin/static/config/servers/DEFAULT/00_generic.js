var logger = require('yaktor/lib/logger')
logger.silly(__filename)

// maps between our setting name and express's well-known settings
var mappings = { // see http://expressjs.com/en/4x/api.html#app.settings.table
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
  Object.keys(mappings).forEach(function (setting) {
    var val = val = app.getConfigVal('express.' + setting)
    if (val !== null) app.set(mappings[ setting ], val)
  })

  done && done()
}
