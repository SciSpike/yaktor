var path = require('path')
var fs = require('fs')
var async = require('async')
var exts = [ 'js' ]

module.exports = function (done) {
  var self = this
  var dir = this.get('initializersPath')
  // NOTE: Sorting is required, due to the fact that no order is guaranteed
  //       by the system for a directory listing.  Sorting allows initializers
  //       to be prefixed with a number, and loaded in a pre-determined order.
  var files = fs.readdirSync(dir).sort()
  async.forEachSeries(files, function (file, next) {
    var regex = new RegExp('\\.(' + exts.join('|') + ')$')
    if (regex.test(file)) {
      var mod = require(path.join(dir, file))
      if (typeof mod === 'function') {
        var arity = mod.length
        if (arity === 1) {
          // Async initializer.  Exported function will be invoked, with next
          // being called when the initializer finishes.
          mod.call(self, next)
        } else {
          // Sync initializer.  Exported function will be invoked, with next
          // being called immediately.
          mod.call(self)
          next()
        }
      } else {
        // Initializer does not export a function.  Requiring the initializer
        // is sufficient to invoke it, next immediately.
        next()
      }
    } else {
      next()
    }
  }, function (err) {
    done(err)
  })
}
