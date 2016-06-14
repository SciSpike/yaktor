var path = require('path')
var fs = require('fs')
var async = require('async')

var settings = {}
fs.readdirSync(__dirname).forEach(function (file) {
  var pathname = path.join(__dirname, file)
  if (!fs.lstatSync(pathname).isDirectory()) return

  if (settings[ file ]) throw new Error('cannot use configuration name "' + file + '" -- already used in global settings')
  settings[ file ] = require(pathname)
});

var regex = /\.js$/
module.exports = {
  settings: settings,
  init: function (yaktor, done) {
    // NOTE: Sorting is required, due to the fact that no order is guaranteed
    //       by the system for a directory listing.  Sorting allows initializers
    //       to be prefixed with a number, and loaded in a pre-determined order.
    var files = fs.readdirSync(__dirname).sort()
    async.forEachSeries(files, function (file, next) {
      var pathname = path.join(__dirname, file)
      if (fs.lstatSync(pathname).isDirectory() || file === 'index.js' || !regex.test(file)) return next()

      try {
        var initializer = require(pathname)
        if (typeof initializer === 'function') {
          initializer(yaktor, next)
        } else {
          // requiring the initializer is sufficient to invoke it, next immediately.
          next()
        }
      } catch (e) {
        next(e)
      }
    }, done)
  }
}
