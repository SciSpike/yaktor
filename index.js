/**
 * This is the main startup file or the bootstrap if you'd like.
 */
process.on('uncaughtException', function (err) {
  console.log(err.stack)
})

// Model dependencies
var express = require('express')
var init = require('./lib/init.js')
var logger = require('./lib/logger')
var path = require('path')
var fs = require('fs')
var async = require('async')
var sockjs = require('sockjs')
var util = require('util')

logger.init()
process.removeAllListeners('uncaughtException')
process.on('uncaughtException', function (err) {
  logger.error(err.stack)
})

var httpProto = 'http'
var yaktor = module.exports = {
  logger: logger,
  services: require('./app/services'),
  converter: require('./app/services/conversionService'),
  start: function (callback) {
    var serversPath = path.resolve('servers')
    var ports = []
    async.eachSeries(fs.readdirSync(serversPath), function (file, cb) {
      // Read the server configuration
      var serverConfig = require(path.join(serversPath, file))

      // Configure the application
      var app = express()

      var protocol = serverConfig.protocol || httpProto
      var serverFactory = require(protocol)
      var server = (protocol === httpProto) ? serverFactory.createServer(app) : serverFactory.createServer(serverConfig.options, app)

      // Install socket-ability
      var io = sockjs.createServer()
      io.installHandlers(server, { prefix: '/ws/([^/.]+)(/auth/([^/.]+)){0,1}' })
      app.io = io
      app.server = server

      // Make the port configurable, but 3000 by/for default
      app.set('protocol', protocol)
      app.set('port', serverConfig.port)
      app.set('express', express) // tells us where to find the views
      app.set('initializersPath', serverConfig.initializersPath)
      app.set('routesPath', serverConfig.routesPath)
      app.set('actionsPath', serverConfig.actionsPath)
      // Tells app where to find the views
      app.set('views', path.resolve('conversations', 'ejs'))
      app.yaktor = yaktor
      Object.defineProperty(app, 'conversation', {
        enumerable: true,
        get: util.deprecate(function () {
          return app.yaktor
        }, 'Use property "yaktor" instead'),
        set: function () {
          throw new Error('setting property "conversation" disallowed')
        }
      })
      init.call(app, function (err) {
        if (err) {
          logger.error(new Error((err.stack ? err.stack : err.toString()) + '\nRethrown:').stack)
          return cb(err)
        }
        // Setup the server
        ports.push(app.get('port'))
        server.listen(app.get('port'), cb)
      })
    }, function (err) {
      if (yaktor.gossipmonger) { yaktor.gossipmonger.gossip() }
      require('./engine')([ path.resolve('conversations', 'js') ], function () {
        callback(err, ports)
      })
    })
  }
}
