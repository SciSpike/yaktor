var logger = require('yaktor/logger')
logger.silly(__filename)
var path = require('path')
var fs = require('fs')
var initialized = false

module.exports = function (yaktor, done) {
  try {
    if (initialized) return

    config = yaktor.config

    var modelAll = path.resolve(path.join(config.get('yaktor.generator.basedir'), config.get('yaktor.generator.models')))
    if (fs.existsSync(modelAll)) {
      // all we care is that they have been pre-loaded
      require(modelAll)
    }

    var types = path.resolve(path.join(config.get('yaktor.conversations.basedir'), config.get('yaktor.conversations.types')))
    if (fs.existsSync(types)) {
      require(types)
    }
    initialized = true
    done && done()
  } catch (e) {
    logger.error(e.stack)
    done(e)
  }
}
