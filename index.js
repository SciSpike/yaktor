var path = require('path')
var suppress = process.env.SUPRESS_NO_CONFIG_WARNING
process.env.SUPRESS_NO_CONFIG_WARNING = 'y'
var config = require('config')
process.env.SUPRESS_NO_CONFIG_WARNING = suppress

var async = require('async')
var _ = require('lodash')

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

    var log = require('./logger')
    process.on('uncaughtException', function (err) {
      log.error('uncaught exception', err.stack)
    })
    var yaktorConfig = JSON.parse(JSON.stringify(config.yaktor)) // HACK
    if (yaktorConfig.yaktor) delete yaktorConfig.yaktor // HACK: not sure why this is showing up...oddity of require('config')?
    // bootstrap time static configuration
    log.info('YAKTOR CONFIGURATION: ' + JSON.stringify(yaktorConfig, 0, 2))

    Object.keys(yaktorConfig).forEach(function (setting) {
      yaktor[ setting ] = yaktorConfig[ setting ]
    })

    async.series([
      async.apply(globals.init, yaktor), // initialize globals
      function (next) { // initialize each server
        yaktor.serverContexts = {}
        async.eachSeries(Object.keys(yaktor.servers), function (serverName, next) {
          var server = servers[ serverName ]
          var ctx = _.cloneDeep(yaktorConfig.servers[ serverName ])
          // this provides a back door via require('yaktor').serverContexts[...]...
          yaktor.serverContexts[ serverName ] = ctx
          ctx.serverName = serverName
          Object.keys(yaktor).forEach(function (setting) {
            if (setting !== 'servers' || setting !== 'start' || setting !== 'serverContexts') {
              // merge global settings into server settings with server settings winning
              ctx[ setting ] = _.merge(_.cloneDeep(yaktor[ setting ]), ctx[ setting ] || {})
            }
          })
          server.init(ctx, function (err) {
            if (err) log.error(new Error((err.stack ? err.stack : err.toString()) + '\nRethrown:').stack)
            next(err)
          })
        }, function (err) {
          if (err) next(err)

          require('./engine')([ path.resolve('conversations', 'js') ], function (err) {
            callback(err)
          })
        })
      }
    ], function (err) {
      callback(err)
    })
  }
}

module.exports = yaktor
