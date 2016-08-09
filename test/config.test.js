/* global describe, it */
var path = require('path')
var proxyquire = require('proxyquire')
var assert = require('assert')

function Global (m) {
  m['@noCallThru'] = true
  m['@global'] = true
  return m
}
describe(path.basename(__filename), function () {
  it('should be able to get props initially', function () {
    var proxies = {}
    var global = proxies[path.resolve('config', 'global')] = Global({
      settings: {
        a: 'global-a',
        b: 'global-b',
        c: 'global-c'
      }
    })
    var servers = proxies[path.resolve('config', 'servers')] = Global({
      bob: {
        settings: {
          a: 'bob-b'
        }
      }
    })
    proc.env.C = 'env-c'
    var yaktor = proxyquire(path.resolve('index'), proxies)
    assert.equal(yaktor.a, global.settings.a)
    assert.equal(yaktor.b, global.settings.b)
    assert.equal(yaktor.servers.bob.a, servers.bob.settings.a)
    assert.equal(yaktor.c, proc.env.C)
  })
})
