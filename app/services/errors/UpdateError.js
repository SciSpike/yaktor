var util = require('util')
var AbstractError = require('./AbstractError')

var UpdateError = function UpdateError (msg) {
  AbstractError.call(this, msg)
}

util.inherits(UpdateError, AbstractError)

UpdateError.prototype.message = 'Object Error'
UpdateError.prototype.constructor = UpdateError

module.exports = UpdateError
