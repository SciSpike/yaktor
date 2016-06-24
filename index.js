var path = require('path')
var async = require('async')
var _ = require('lodash')
var cev = require('config-cev-generator')
var debug = require('debug')('yaktor-config')

var globals
var servers
var yaktor = {
  start: function (configuration, callback) {
    if (typeof configuration === 'function') {
      callback = configuration
      configuration = {}
    }
    globals = require(path.resolve('config', 'global'))
    servers = require(path.resolve('config', 'servers'))

    // get default configuration values and put them on yaktor
    _.merge(yaktor, getConfigDefaults())
    debug('configuration defaults:')
    debug(JSON.stringify(yaktor, 0, 2))

    // now override from environment variables
    var envOverrides = getConfigEnvironmentVariables(yaktor)
    var serversEnvOverrides = envOverrides.servers
    var globalEnvOverrides = _.cloneDeep(envOverrides)
    delete globalEnvOverrides.servers
    _.merge(yaktor, globalEnvOverrides)
    debug('configuration after overriding from environment variables:')
    debug(JSON.stringify(yaktor, 0, 2))

    // now override from given configuration parameter
    _.merge(yaktor, configuration)
    debug('configuration after overriding from start function parameter:')
    debug(JSON.stringify(yaktor, 0, 2))

    // log bootstrap time static configuration FYI
    debug('YAKTOR CONFIGURATION:')
    debug(JSON.stringify(yaktor, 0, 2))

    // initialize logger
    var log = require('./logger').yaktorInit(yaktor)
    process.on('uncaughtException', function (err) {
      log.error('uncaught exception', err.stack)
    })

    async.series([
      async.apply(globals.init, yaktor), // call global initializers
      function (next) { // initialize all the servers
        yaktor.serverContexts = {}
        async.eachSeries(Object.keys(yaktor.servers), function (serverName, next) {
          var server = servers[ serverName ]
          var ctx = _.cloneDeep(server.settings)
          // override values from environment variables
          _.merge(ctx, serversEnvOverrides[ serverName ] || {})
          // override values from configuration parameter
          _.merge(ctx, configuration.servers && configuration.servers[ serverName ] || {})
          // this allows a server to get at all config via require('yaktor').serverContexts['...']....
          yaktor.serverContexts[ serverName ] = ctx
          ctx.serverName = serverName
          Object.keys(yaktor).forEach(function (setting) {
            switch (setting) {
              case 'start': // the function you're currently in
              case 'servers': // settings for all servers
              case 'serverContexts': // yaktor's bucket for all server contexts
                return // skip because these aren't appropriate for the current server context
              default:
                // else merge copy of global context into server context with server context winning any conflicts
                ctx[ setting ] = _.merge(_.cloneDeep(yaktor[ setting ]), ctx[ setting ] || {})
                return
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

var getConfigDefaults = function () {
  // get design-time default configurations
  var defaults = {}
  Object.keys(globals.settings).forEach(function (key) {
    defaults[ key ] = globals.settings[ key ]
  })

  defaults.servers = {}
  Object.keys(servers).forEach(function (serverName) {
    defaults.servers[ serverName ] = servers[ serverName ].settings
  })

  return defaults
}

var getConfigEnvironmentVariables = function (object) {
  var mappings = cev.generate(object || {}, {
    noPrefix: true
  })
  debug('environment variable mappings:')
  debug(JSON.stringify(mappings, 0, 2))

  var walkMappings = function (mappings, configPrefix) {
    configPrefix = configPrefix || []

    Object.keys(mappings).forEach(function (key) {
      switch (typeof mappings[ key ]) {
        case 'string':
          var envarName = mappings[ key ]
          var envarValue = process.env[ envarName ]
          if (envarValue) {
            mappings[ key ] = envarValue
            debug('replaced configuration setting "' + configPrefix.concat(key).join('.') + '" with value "' + envarValue + '" from environment variable "' + envarName + '"')
          }
          else {
            delete mappings[ key ]
            debug('no value found in environment variable "' + envarName + '" for configuration setting "' + configPrefix.concat(key).join('.') + '"')
          }
          break
        case 'object':
          mappings[ key ] = walkMappings(mappings[ key ], configPrefix.concat(key))
          if (Object.keys(mappings[ key ]).length === 0) {
            delete mappings[ key ]
          }
          break
      }
    })
    return mappings
  }
  return walkMappings(mappings)
}

module.exports = yaktor
