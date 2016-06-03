var logger = require('yaktor/lib/logger')
logger.silly(__filename)
var path = require('path')
var fs = require('fs')

// change this to your path to modelAll.
var modelAll = path.resolve(path.join('src-gen', 'modelAll'))
if (fs.existsSync(modelAll)) {
  // all we care is that they have been pre-loaded
  try {
    require(modelAll)
  } catch (e) {
    logger.error(e.stack)
  }
}

var types = path.resolve(path.join('conversations', 'types'))

module.exports = function () {
  if (fs.existsSync(types)) {
    require(types)
  }
}
