var loader = require('./moduleLoader')
var conversationInitializer = require('./conversationInitializer')
// var logger = require('../lib/logger')
var async = require('async')
// var moduleInitializer = require("./moduleInitializer")
// var bundleLoader = require('./bundleLoader')

module.exports = function (moduleDirectories, cb) {
  loader(moduleDirectories, function (err, modules) { // eslint-disable-line handle-callback-err
    async.each(modules, function (module, cb) {
      conversationInitializer(module, cb)
    }, cb)
  })
}
