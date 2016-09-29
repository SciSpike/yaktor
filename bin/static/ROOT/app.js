#!/usr/bin/env node
var yaktor = require('yaktor')
var log = require('yaktor/logger')
var config = {
  // TODO: pass any values here to override environment variables and to override values in ./config
}

yaktor.start(config, function (err) {
  if (err) {
    log.error(err, err.stack)
    return process.exit(1)
  }
  log.info('yaktor started ok')
})
