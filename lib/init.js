var path = require('path')
var fs = require('fs')
var async = require('async')
var exts = [ 'js' ]

module.exports = function (done) {
  var app = this
  var cfg = app.get('serverConfig')
  var dir = path.resolve(cfg.initializersPath)
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
          var arity = initializer.length
          if (arity === 1) {
            // Async initializer.  Exported function will be invoked, with next
            // being called when the initializer finishes.
            initializer.call(app, next)
          } else {
            // Sync initializer.  Exported function will be invoked, with next
            // being called immediately.
            try {
              initializer.call(app)
              next()
            } catch (e) {
              next(e)
            }
          }
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
