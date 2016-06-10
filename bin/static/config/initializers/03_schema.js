var logger = require('yaktor/lib/logger')
logger.silly(__filename)
var path = require('path')
var fs = require('fs')
var initialized = false

module.exports = function () {
  if (initialized) return
  var app = this
  var config = app.yaktor.config

  var modelAll = path.resolve(path.join(config.get('yaktor.generator.basedir'), config.get('yaktor.generator.models')))
  if (fs.existsSync(modelAll)) {
    // all we care is that they have been pre-loaded
    try {
      require(modelAll)
    } catch (e) {
      logger.error(e.stack)
      throw e
    }
  }

  var types = path.resolve(path.join(config.get('yaktor.conversations.basedir'), config.get('yaktor.conversations.types')))
  if (fs.existsSync(types)) {
    require(types)
  }
  initialized = true
}
