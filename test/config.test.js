/* global describe, it */
var path = require('path')
var proxyquire = require('proxyquire')
var assert = require('assert')

function Global (m) {
  m[ '@noCallThru' ] = true
  m[ '@global' ] = true
  return m
}
function unGlobal (m) {
  delete m[ '@noCallThru' ]
  delete m[ '@global' ]
}
var coop = function (cfg, cb) { cb() }
describe(path.basename(__filename), function () {
  it('should be able to get props initially', function (done) {
    var proxies = {}
    var global = proxies[ path.resolve('config', 'global') ] = Global({
      settings: {
        a: 'global-a',
        b: 'global-b',
        c: 'global-c'
      },
      init: coop
    })
    var servers = proxies[ path.resolve('config', 'servers') ] = Global({
      bob: {
        settings: {
          a: 'bob-b'
        },
        init: coop
      }
    })
    proxies['./logger'] = Global({
      yaktorInit: function () {
        return {
          error: console.log.bind(console)
        }
      }
    })
    proxies['./engine'] = Global(coop)
    process.env.C = 'env-c'
    var yaktor = proxyquire(path.resolve('index'), proxies)
    unGlobal(yaktor.servers)
    assert.equal(yaktor.a, global.settings.a)
    assert.equal(yaktor.b, global.settings.b)
    assert.equal(yaktor.servers.bob.a, servers.bob.settings.a)
    assert.equal(yaktor.c, process.env.C)
    yaktor.start({}, done)
  })
})
