#!/usr/bin/env node
var config = require('config')
var yaktor = require('yaktor')

yaktor.start(config, function (err, ports) {
  if (!err) {
    require('dns').lookup(require('os').hostname(), function (err, ip) {
      err || yaktor.log.info('Yaktor started. Listening on IP address ', ip, 'on port(s) ', ports.join(','))
    })
  }
})
