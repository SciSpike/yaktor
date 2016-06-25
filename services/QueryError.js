var util = require('util')
var AbstractError = require('./AbstractError')

var QueryError = function QueryError (msg) {
  QueryError.super_.call(this, msg, this.constructor)
}

util.inherits(QueryError, AbstractError)

QueryError.prototype.message = 'Query Found'

module.exports = QueryError
