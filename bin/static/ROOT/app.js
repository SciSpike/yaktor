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

  console.log(JSON.stringify(serverPorts))

  dns.lookup(os.hostname(), function (err, ip) { // eslint-disable-line handle-callback-err
    yaktor.log.info('yaktor started; listening%s with server%s %s',
      !ip ? '' : ' on IP address ' + ip,
      serverPorts.length === 1 ? '' : 's',
      serverPorts.map(function (it) { return it.server + ' at port ' + it.port }).join(','))
  })
})
