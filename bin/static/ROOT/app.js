var config = require('config')
var yaktor = require('yaktor')(config)
var logger = yaktor.logger

yaktor.start(function (err, ports) {
  if (!err) {
    require('dns').lookup(require('os').hostname(), function (err, ip) {
      err || logger.info('Yaktor started. Listening on IP address ', ip, 'on port(s) ', ports.join(','))
    })
  }
})
