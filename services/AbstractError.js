var util = require('util')

var nameProp = {
  get: function () {
    var funcNameRegex = /function (.{1,})\(/
    var results = (funcNameRegex).exec((this).constructor.toString())
    return (results && results.length > 1) ? results[ 1 ] : ''
  },
  set: function (value) {
    throw new Error('You may not set the name')
  }
}
// Create a new Abstract Error constructor
var AbstractError = function AbstractError (msg, constr) {
  // If defined, pass the constr property to V8's
  // captureStackTrace to clean up the output
  Error.captureStackTrace(this, constr || this.constructor || this)

  // If defined, store a custom error message
  this.message = msg || this.message || 'Error'

  // name must be defined on this
  Object.defineProperty(this, 'name', nameProp)
}

// Extend our AbstractError from Error
util.inherits(AbstractError, Error)

module.exports = AbstractError
