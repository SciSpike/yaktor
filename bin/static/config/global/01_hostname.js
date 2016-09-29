var logger = require('yaktor/logger')
logger.info(__filename)
var dns = require('dns')

module.exports = function (yaktor, done) {
  dns.lookup(yaktor.hostname, function (err, ip) {
    yaktor.ip = ip
    done(err)
  })
}
