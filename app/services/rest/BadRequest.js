var util = require('util')
var AbstractError = require('../errors/AbstractError')

var BadRequest = function BadRequest (msg) {
  AbstractError.call(this, msg)
}

util.inherits(BadRequest, AbstractError)

BadRequest.prototype.message = 'Bad Request'
BadRequest.prototype.constructor = BadRequest

module.exports = BadRequest
