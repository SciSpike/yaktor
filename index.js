var path = require('path')
var suppress = process.env.SUPRESS_NO_CONFIG_WARNING
process.env.SUPRESS_NO_CONFIG_WARNING = 'y'
var config = require('config')
process.env.SUPRESS_NO_CONFIG_WARNING = suppress

var express = require('express')
var async = require('async')
var sockjs = require('sockjs')
var http = 'http'

var yaktor = {
  start: function (configuration, callback) {
    if (configuration && typeof configuration === 'function') {
      callback = configuration
      configuration = {}
    }
    // get design-time default configurations
    var defaults = {}
    var globals = require(path.resolve('config', 'global'))
    Object.keys(globals.settings).forEach(function (key) {
      defaults[ key ] = globals.settings[ key ]
    })
    defaults.servers = {}
    var servers = require(path.resolve('config', 'servers'))
    Object.keys(servers).forEach(function (serverName) {
      defaults.servers[ serverName ] = servers[ serverName ].settings
    })
    // NOTE: npm module 'config' versions 1.20.2 - 1.21.0 are buggy: https://github.com/lorenwest/node-config/issues/329
    // which causes the next line to bork with "Cannot redefine property" error
    config.util.extendDeep(defaults, configuration)
    config.util.setModuleDefaults('yaktor', defaults)
    yaktor.config = config

    yaktor.logger = yaktor.log = require('./logger')
    process.on('uncaughtException', function (err) {
      yaktor.logger.error('uncaught exception', err.stack)
    })
    yaktor.logger.info('YAKTOR CONFIGURATION: ' + JSON.stringify(config.yaktor, 0, 2))

    var services = require('./app/services')
    yaktor.services = services
    yaktor.conversionService = services.conversionService

    async.series([
      async.apply(globals.init, yaktor), // initialize globals
      function (next) { // initialize each server
        var ports = []
        async.eachSeries(Object.keys(config.get('yaktor.servers')), function (serverName, cb) {
          var app = express()
          app.yaktor = yaktor

          var prefix = [ 'yaktor', 'servers', serverName ]
          var getConfigVal = function (path) {
            return app.yaktor.config.get(prefix.concat(path).join('.'))
          }
          app.getConfigVal = getConfigVal // handy for server initializers
          var hasConfigVal = function (path) {
            return app.yaktor.config.has(prefix.concat(path).join('.'))
          }
          app.hasConfigVal = hasConfigVal // handy for server initializers

          var protocol = getConfigVal('host.protocol')
          var serverFactory = require(protocol)
          var server = (protocol === http)
            ? serverFactory.createServer(app)
            : serverFactory.createServer(getConfigVal('host.options'), app)
          app.server = server

          // Install socket-ability
          var io = sockjs.createServer()
          io.installHandlers(server, { prefix: '/ws/([^/.]+)(/auth/([^/.]+)){0,1}' })
          app.io = io

          servers[ serverName ].init(serverName, app, function (err) {
            if (err) {
              yaktor.logger.error(new Error((err.stack ? err.stack : err.toString()) + '\nRethrown:').stack)
              return cb(err)
            }

            var port = parseInt(getConfigVal('host.port'))
            ports.push(port)
            server.listen(port, cb)
          })
        }, function (err) {
          if (err) next(err)

          if (yaktor.gossipmonger) { yaktor.gossipmonger.gossip() }
          var modulePath = path.resolve('conversations', 'js')
          require('./engine')([ modulePath ], function (err) {
            callback(err, ports)
          })
        })
      }
    ], function (err) {
      callback(err)
    })
  }
}

module.exports = yaktor
