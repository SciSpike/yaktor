var logger = require('yaktor/logger')
logger.info(__filename)
var express = require('express')
var http = 'http'

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

module.exports = function (ctx, done) {
  var app = ctx.app = express()

  Object.keys(mappings).forEach(function (setting) {
    var val = ctx.express[ setting ]
    if (val !== null) app.set(mappings[ setting ], val)
  })

  var protocol = ctx.host.protocol
  var serverFactory = require(protocol)
  ctx.server = (protocol === http)
    ? serverFactory.createServer(app)
    : serverFactory.createServer(ctx.host.options, app)

  done()
}
