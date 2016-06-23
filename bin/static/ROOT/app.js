#!/usr/bin/env node
var config = require('config')
var yaktor = require('yaktor')
var log = require('yaktor/logger')

yaktor.start(config, function (err) {
  if (err) {
    console.log(err)
    return process.exit(1)
  }
  log.info('yaktor started ok')
})
