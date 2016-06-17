var fs = require('fs')
var path = require('path')
// var vm = require('vm')
// var nativeModule = require('module')
var logger = require('../logger')
var async = require('async')

module.exports = function (moduleDirectories, callback) {
  var modules = []
  async.each(moduleDirectories, function (directory, cb) {
    logger.silly('gathering modules from %s', directory)
    async.each(fs.readdirSync(directory), function (file, done) {
      var moduleDirectory = path.join(directory, file)
      if (fs.statSync(moduleDirectory).isDirectory() && file !== 'models') {
        modules.push(require(moduleDirectory))
      }
      done()
    }, cb)
  }, function (err) {
    callback(err, modules)
  })
}
