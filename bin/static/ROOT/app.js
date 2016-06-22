#!/usr/bin/env node
var dns = require('dns')
var os = require('os')
var config = require('config')
var yaktor = require('yaktor')

yaktor.start(config, function (err, serverPorts) {
  if (err) {
    console.log(err)
    return process.exit(1)
  }

  dns.lookup(os.hostname(), function (err, ip) { // eslint-disable-line handle-callback-err
    yaktor.log.info('yaktor started; %s',
      serverPorts.map(function (it) { return it.server + '@' + (ip ? ip + ':' : '') + it.port }).join(','))
  })
})
