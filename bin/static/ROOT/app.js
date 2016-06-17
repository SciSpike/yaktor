#!/usr/bin/env node
var dns = require('dns')
var os = require('os')
var config = require('config')
var yaktor = require('yaktor')

yaktor.start(config, function (err, ports) {
  if (err) {
    console.log(err)
    return process.exit(1)
  }

  dns.lookup(os.hostname(), function (err, ip) {
    yaktor.log.info('Yaktor started. Listening on IP address ', ip || '(unknown)', 'on port(s) ', ports.join(','))
  })
})
