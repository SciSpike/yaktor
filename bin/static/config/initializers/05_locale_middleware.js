var locale = require('locale')
var path = require('path')
var async = require('async')
var fs = require('fs')
var logger = require(path.resolve('node_modules/conversation/lib/logger'))

logger.silly(__filename)
module.exports = function (done) {
  var app = this
  if (fs.existsSync(path.resolve('views', 'locale'))) {
    async.map(fs.readdirSync(path.resolve('views', 'locale')), function (lang, cb) {
      cb(null, lang.replace(/\..*/, ''))
    }, function (err, result) { // eslint-disable-line handle-callback-err
      app.use(locale(result))
      done()
    })
  } else {
    app.use(locale())
    done()
  }
}
