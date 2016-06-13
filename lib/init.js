var path = require('path')
var fs = require('fs')
var async = require('async')
var exts = [ 'js' ]

module.exports = {
  initGlobals: function (yaktor, done) {
    var dir = path.resolve('config', 'global')

    // NOTE: Sorting is required, due to the fact that no order is guaranteed
    //       by the system for a directory listing.  Sorting allows initializers
    //       to be prefixed with a number, and loaded in a pre-determined order.
    var files = fs.readdirSync(dir).sort()
    async.forEachSeries(files, function (file, next) {
      var regex = new RegExp('\\.(' + exts.join('|') + ')$')
      if (regex.test(file)) {
        try {
          var initializer = require(path.join(dir, file))
          if (typeof initializer === 'function') {
            initializer(yaktor, next)
          } else {
            // Initializer does not export a function.  Requiring the initializer
            // is sufficient to invoke it, next immediately.
            next()
          }
        } catch (e) {
          next(e)
        }
      } else {
        next()
      }
    }, function (err) {
      done(err)
    })
  },

  initServer: function (serverName, app, done) {
    var dir = path.resolve(app.hasConfigVal('initializersPath')
      ? app.getConfigVal('initializersPath')
      : path.join('config', 'servers', serverName))

    // NOTE: Sorting is required, due to the fact that no order is guaranteed
    //       by the system for a directory listing.  Sorting allows initializers
    //       to be prefixed with a number, and loaded in a pre-determined order.
    var files = fs.readdirSync(dir).sort()
    async.forEachSeries(files, function (file, next) {
      var regex = new RegExp('\\.(' + exts.join('|') + ')$')
      if (regex.test(file) && file !== 'index.js') {
        try {
          var initializer = require(path.join(dir, file))
          if (typeof initializer === 'function') {
            initializer(serverName, app, next)
          } else {
            // Initializer does not export a function.  Requiring the initializer
            // is sufficient to invoke it, next immediately.
            next()
          }
        } catch (e) {
          next(e)
        }
      } else {
        next()
      }
    }, function (err) {
      done(err)
    })
  }
}
