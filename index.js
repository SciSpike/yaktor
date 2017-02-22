var path = require('path')
var async = require('async')
var _ = require('lodash')
var cev = require('config-cev-generator')
var debug = require('debug')('yaktor:config')

var globals
var servers
var yaktor = {
  start: function (configuration, startDone) {
    if (typeof configuration === 'function') {
      startDone = configuration
      configuration = {}
    }
    // now override from given configuration parameter
    debug('supplied configuration object:')
    debug(JSON.stringify(configuration, 0, 2))
    _.merge(yaktor, configuration)

    // configuration overriding is done
    debug('resolved yaktor configuration:')
    debug(JSON.stringify(yaktor, 0, 2))

    async.series([
      async.apply(globals.init, yaktor), // call global initializers
      function (serversDone) { // initialize all the servers
        yaktor.serverContexts = {}
        async.eachSeries(Object.keys(yaktor.servers), function (serverName, nextServer) {
          var server = yaktor.servers[ serverName ]
          var ctx = _.cloneDeep(server)
          // this allows a server to get at other servers' contexts via require('yaktor').serverContexts['...']....
          yaktor.serverContexts[ serverName ] = ctx
          ctx.serverName = serverName
          Object.keys(yaktor).forEach(function (setting) {
            switch (setting) {
              case 'start': // the function you're currently in
              case 'servers': // settings for all servers
              case 'serverContexts': // yaktor's bucket for all server contexts
                return // skip because these aren't appropriate for the current server context

              default: // merge copy of global context into server context with server context winning any conflicts
                ctx[ setting ] = _.merge(_.cloneDeep(yaktor[ setting ]), ctx[ setting ] || {})
                return
            }
          })
          servers[ serverName ].init(ctx, nextServer)
        }, serversDone)
      },
      function (engineDone) {
        require('./engine')([ path.resolve('conversations', 'js') ], engineDone)
      }
    ], startDone)
  }
}

var getConfigDefaults = function (opts) {
  opts = opts || { global: true, servers: true }
  var defaults = {}
  if (opts && opts.global) {
    Object.keys(globals.settings).forEach(function (key) {
      defaults[ key ] = globals.settings[ key ]
    })
  }
  if (opts && opts.servers) {
    defaults.servers = {}
    Object.keys(servers).forEach(function (serverName) {
      defaults.servers[ serverName ] = servers[ serverName ].settings
    })
  }
  return defaults
}

var getConfigEnvironmentVariables = function (object, opts) {
  var mappings = cev.generate(object || {}, opts || { noPrefix: true })
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
          } else {
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

// this is all static so load it now and make available early
globals = require(path.resolve('config', 'global'))
servers = require(path.resolve('config', 'servers'))

// get default configuration values and put them on yaktor
_.merge(yaktor, getConfigDefaults())
debug('configuration defaults:')
debug(JSON.stringify(yaktor, 0, 2))

// now override from environment variables
var opts = {}
if (yaktor.env && yaktor.env.prefix) {
  opts.prefix = yaktor.env.prefix
  debug('using environment variable prefix "' + opts.prefix + '"')
} else {
  opts.noPrefix = true
  debug('using no environment variable prefix')
}
_.merge(yaktor, getConfigEnvironmentVariables(yaktor, opts))
debug('configuration after overriding from environment variables:')
debug(JSON.stringify(yaktor, 0, 2))

module.exports = yaktor
