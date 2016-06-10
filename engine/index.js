var async = require('async')
var loadModule = require('./moduleLoader')
var initializeConversation = require('./conversationInitializer')

module.exports = function (moduleDirectories, cb) {
  loadModule(moduleDirectories, function (err, modules) { // eslint-disable-line handle-callback-err
    async.each(modules, function (module, cb) {
      initializeConversation(module, cb)
    }, cb)
  })
}
