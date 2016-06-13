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

var services = require('./app/services')

var yaktor = {
  services: services,
  converter: services.conversionService,
  start: function (configuration, callback) {
    if (configuration && typeof configuration === 'function') {
      callback = configuration
      configuration = {}
    }
    // get design-time default configurations
    var defaults = require('./defaults') // yaktor defaults
    defaults.servers = require(path.resolve('config', 'servers')) // defaults for each server
    var featureGlobalsDir = path.resolve('config', 'defaults') // defaults for features like cassandra
    var featureGlobals = require(featureGlobalsDir)
    for (var key in Object.keys(featureGlobals)) {
      // keys can't conflict with our keys
      if (defaults[ key ]) return callback(new Error('cannot use name "' + key + '" in ' + featureGlobalsDir))
      defaults[ key ] = featureGlobals[ key ]
    }
    // NOTE: npm module 'config' versions 1.20.2 - 1.21.0 are buggy: https://github.com/lorenwest/node-config/issues/329
    // which causes the next line to bork with "Cannot redefine property" error
    config.util.extendDeep(defaults, configuration)
    config.util.setModuleDefaults('yaktor', defaults)
    yaktor.config = config

    yaktor.logger = yaktor.log = require('./lib/logger')
    process.on('uncaughtException', function (err) {
      yaktor.logger.error(err.stack)
    })
    yaktor.logger.info('YAKTOR CONFIGURATION: ' + JSON.stringify(config, 0, 2))

    async.series([
      async.apply(init.initGlobals, yaktor), // initialize globals
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

          var protocol = getConfigVal('protocol')
          var serverFactory = require(protocol)
          var server = (protocol === http)
            ? serverFactory.createServer(app)
            : serverFactory.createServer(getConfigVal('options'), app)
          app.server = server

          // Install socket-ability
          var io = sockjs.createServer()
          io.installHandlers(server, { prefix: '/ws/([^/.]+)(/auth/([^/.]+)){0,1}' })
          app.io = io

          init.initServer(serverName, app, function (err) {
            if (err) {
              yaktor.logger.error(new Error((err.stack ? err.stack : err.toString()) + '\nRethrown:').stack)
              return cb(err)
            }
            // Setup the server
            var port = parseInt(getConfigVal('port'))
            ports.push(port)
            server.listen(port, cb)
          })
        }, function (err) {
          if (err) next(err)

          if (yaktor.gossipmonger) { yaktor.gossipmonger.gossip() }
          var modulePath = path.resolve(path.join(config.get('yaktor.conversations.basedir'), config.get('yaktor.conversations.modules')))
          require(config.get('yaktor.enginePath'))([ modulePath ], function (err) {
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
