/* global describe, it */
var path = require('path')
var proxyquire = require('proxyquire')
var Promise = require('bluebird')
var assert = require('assert')
var hostname = require('os').hostname()

function Global (m) {
  m['@noCallThru'] = true
  m['@global'] = true
  return m
}

var noop = function () {
}
var logger = {
  error: noop,
  info: noop,
  debug: noop,
  silly: noop
}
describe(path.basename(__filename), function () {
  it('should be connect to fake peers', function () {
    var stack = 'stack'
    var onMessage
    var server1 = '127.0.0.1'
    var server2 = '127.0.0.2'
    var server3 = '127.0.0.3'
    var connect = function (url) {
      assert(/127\.0\.0\.[23]/.test(url), url + ' was not as expected')
    }
    var count = 0
    var proxies = {
      'dns': Global({
        lookup: function (name, opt, cb) {
          cb = cb || opt
          if (name === hostname) {
            cb(null, [{
              address: server1
            }])
          } else if (name === stack) {
            cb(null, [{
              address: server2
            }, {
              address: server3
            }])
          }
        }
      }),
      'zmq': Global({
        socket: function (type) {
          return proxies.zmq[type]
        },
        'pub': {
          send: function (arr) {
            count++ % 2 ? onMessage(server2, arr[1], arr[2] + '2', arr[3]) : onMessage(server3, arr[1], arr[2] + '3',
              arr[3])
          },
          bind: function (url, cb) {
            cb()
          }
        },
        'sub': {
          connect: connect,
          subscribe: noop,
          monitor: noop,
          on: function (topic, cb) {
            if (topic === 'message') {
              onMessage = cb
            }
          }
        }
      })
    }
    proxies[path.join('yaktor', 'logger')] = Global(logger)
    var messageService = proxies[path.join('yaktor', 'services', 'messageService')] = Global({})
    var messaging = proxyquire(path.resolve('bin', 'static', 'config', 'global', '03_messaging'), proxies)
    var config = {
      log: {
        level: 'silly'
      },
      stack: stack,
      messaging: {
        port: '',
        url: '%s%s'
      }
    }

    return Promise.fromCallback(function (cb) {
      messaging(config, cb)
    }).then(function () {
      var allDone = Promise.all([
        Promise.fromCallback(function (cb) {
          messageService.emitter.on('topic2', function () {
            cb()
          })
        }), Promise.fromCallback(function (cb) {
          messageService.emitter.on('topic3', function () {
            cb()
          })
        })
      ]).then(function () {
        // 0 because we are actually using our seq
        assert.equal(config.messaging.peers[server2], 1)
        // 1 because we are actually using our seq
        assert.equal(config.messaging.peers[server3], 0)
        assert(!config.messaging.peers.hasOwnProperty(server1))
      })
      assert.equal(config.messaging.peers[server3], Number.MAX_SAFE_INTEGER)
      assert.equal(config.messaging.peers[server2], Number.MAX_SAFE_INTEGER)
      messageService.emitter.emit('topic', null)
      messageService.emitter.emit('topic', {})
      return allDone
    })
  })
})
