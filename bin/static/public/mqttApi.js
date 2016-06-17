;(function () {
  var log = require('../logger')
  var mqtt = require('mqtt')
  var Backo = require('backo')
  var backoff = new Backo({ min: 100, max: 2000 })
  var isHttps = /^https:/
  var clients = {}
  var clientApi = {
    disconnect: function (urlPrefix) {
      var client = clients[ urlPrefix ]
      delete clients[ urlPrefix ]
      client.end()
      log.info('%s: disconnecting', urlPrefix)
    },
    connectWithPrefix: function (urlPrefix, sessionId, authFunction, isDebug) {
      if (isDebug) {
        log.debug('connecting with %s', urlPrefix)
      }
      var client = clients[ urlPrefix ]
      if (!client) {
        client = clients[ urlPrefix ] = mqtt.connect(urlPrefix + '/mqtt', {
          protocol: isHttps.test(urlPrefix) ? 'wss' : 'ws',
          qos: 0
        })
        backoff.reset()
        client.on('connect', function () {
          backoff.reset()
        })
        client.on('error', function (err) {
          if (/Not authorized|Invalid password/.test(err.message)) {
            setTimeout(function () {
              authFunction(function (err, token) { // eslint-disable-line handle-callback-err
                client.options.username = 'Bearer'
                client.options.password = token
                client._reconnect()
              })
            }, backoff.duration())
          }
          if (isDebug) {
            console.error(new Date().toISOString(), err)
          }
        })
      }
      return client
    },
    connect: function (sessionId, authFunction, isDebug, callback) {
      return clientApi.connectWithPrefix(window.location.origin, sessionId, authFunction, isDebug, callback)
    }
  }
  module.exports = clientApi
})()
