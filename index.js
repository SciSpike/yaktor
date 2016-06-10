/**
 * This is the main startup file or the bootstrap if you'd like.
 */
process.on('uncaughtException', function (err) {
  console.log(err.stack)
})
var path = require('path')
var suppress = process.env.SUPRESS_NO_CONFIG_WARNING
process.env.SUPRESS_NO_CONFIG_WARNING = 'y'
var config = require('config')
process.env.SUPRESS_NO_CONFIG_WARNING = suppress

// Model dependencies
var express = require('express')
var init = require('./lib/init.js')
var fs = require('fs')
var async = require('async')
var sockjs = require('sockjs')
var util = require('util')
var http = 'http'

var defaults = require('./config-defaults.js')

module.exports = function (configuration) {
  // NOTE: npm module 'config' versions 1.20.2 - 1.21.0 are buggy: https://github.com/lorenwest/node-config/issues/329
  // which causes the next line to bork with "Cannot redefine property" error
  config.util.extendDeep(defaults, configuration)
  config.util.setModuleDefaults('yaktor', defaults)

  var logger = require('./lib/logger')

  process.removeAllListeners('uncaughtException')
  process.on('uncaughtException', function (err) {
    logger.error(err.stack)
  })

  var services = require('./app/services')

  var yaktor = {
    config: config,
    logger: logger,
    services: services,
    converter: services.conversionService,
    start: function (callback) {
      logger.info('YAKTOR CONFIGURATION: ' + JSON.stringify(config, 0, 2))
      var servers = config.get('yaktor.servers')
      var ports = []
      async.eachSeries(Object.keys(servers), function (serverName, cb) {
        var cfg = servers[ serverName ]

        var app = express()
        var protocol = cfg.protocol
        var serverFactory = require(protocol)
        var server = (protocol === http) ? serverFactory.createServer(app) : serverFactory.createServer(cfg.options, app)

        // Install socket-ability
        var io = sockjs.createServer()
        io.installHandlers(server, { prefix: '/ws/([^/.]+)(/auth/([^/.]+)){0,1}' })
        app.io = io

        app.server = server
        app.yaktor = yaktor
        app.set('serverName', serverName)
        app.set('serverConfig', cfg)

        if (cfg.caseSensitiveRouting !== null) app.set('case sensitive routing', cfg.caseSensitiveRouting)
        if (cfg.etag !== null) app.set('etag', cfg.etag)
        if (cfg.jsonpCallbackName !== null) app.set('jsonp callback name', cfg.jsonpCallbackName)
        if (cfg.jsonReplacer !== null) app.set('jsonReplacer', cfg.jsonReplacer)
        if (cfg.jsonSpaces !== null) app.set('jsonSpaces', cfg.jsonSpaces)
        if (cfg.queryParser !== null) app.set('query parser', cfg.queryParser)
        if (cfg.stringRouting !== null) app.set('string routing', cfg.stringRouting)
        if (cfg.subdomainOffset !== null) app.set('subdomain offset', cfg.subdomainOffset)
        if (cfg.trustProxy !== null) app.set('trust proxy', cfg.trustProxy)
        if (cfg.views !== null) app.set('views', cfg.views)
        if (cfg.viewCache !== null) app.set('view cache', cfg.viewCache)
        if (cfg.viewEngine !== null) app.set('view engine', cfg.viewEngine)
        if (cfg.xPoweredBy !== null) app.set('x-powered-by', !!cfg.xPoweredBy)
        // TODO: remove -- used by generated ./config/initializers/10_routes.js, not by ./bin/static/config/initializers/10_routes.js
        app.set('routesPath', path.resolve(cfg.routesPath))

        init.call(app, function (err) {
          if (err) {
            logger.error(new Error((err.stack ? err.stack : err.toString()) + '\nRethrown:').stack)
            return cb(err)
          }
          // Setup the server
          var port = parseInt(cfg.port)
          ports.push(port)
          server.listen(port, cb)
        })
      }, function (err) {
        if (yaktor.gossipmonger) { yaktor.gossipmonger.gossip() }
        var modulePath = path.resolve(path.join(config.get('yaktor.conversations.basedir'), config.get('yaktor.conversations.modules')))
        require(config.get('yaktor.enginePath'))([ modulePath ], function () {
          callback(err, ports)
        })
      })
    }
  }

  return yaktor
}
