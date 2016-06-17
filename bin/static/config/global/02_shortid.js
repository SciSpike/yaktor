var logger = require('yaktor/logger')
logger.info(__filename)
var ShortId = require('mongoose-shortid')
var extend = require('util')._extend

var options = {
  len: 6,
  base: 58,
  alphabet: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
}
ShortId.prototype.options = extend(ShortId.prototype, options)
