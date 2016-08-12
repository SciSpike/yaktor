/* global describe, it */
var path = require('path')
var assert = require('assert')
var niceXml = require('nice-xml')
var jsYaml = require('js-yaml')
var qs = require('querystring')

var yamlParse = jsYaml.load.bind(jsYaml)
var yamlStringify = jsYaml.dump.bind(jsYaml)
var qsParse = qs.parse.bind(qs)
var qsStringify = qs.stringify.bind(qs)
var jsonParse = JSON.parse.bind(JSON)
var jsonStringify = JSON.stringify.bind(JSON)
var xmlParse = niceXml.parse.bind(niceXml)
var xmlStringify = niceXml.stringify.bind(niceXml)

var Response = require(path.resolve('services', 'Response'))
var BadRequest = require(path.resolve('services', 'BadRequest'))

var data = {
  'a': 'a',
  'b': 2,
  c: 3.0,
  d: new Date()
}
describe('Response', function () {
  describe('when entity missing', function () {
    var req = {
      accepts: function () {},
      param: function () {}
    }
    ;([['create', 'NOT_CREATED'], ['read', 'NOT_FOUND'], ['update', 'NOT_UPDATED']]).forEach(function (a) {
      var m = a[0]
      describe(m, function () {
        it('should be a ' + a[1], function (done) {
          Response[m](req, {
            status: function (status) {
              assert.equal(Response[a[1]], status)
              done()
            },
            type: function () {},
            end: function () {}
          })()
        })
      })
    })
  })
  describe('when given a BadRequest -error-', function () {
    var req = {
      accepts: function () {},
      param: function () {}
    }
    ;(['create', 'read', 'update', 'delete', 'find']).forEach(function (m) {
      describe(m, function () {
        it('should be a BAD_REQUEST', function (done) {
          var error = new BadRequest()
          Response[m](req, {
            status: function (status) {
              assert.equal(Response.BAD_REQUEST, status)
              done()
            },
            type: function () {},
            end: function () {}
          })(error)
        })
      })
    })
  })
  describe('create', function () {
    describe('with data', function () {
      ;([['application/json', jsonParse, jsonStringify], ['text/xml', xmlParse, xmlStringify], ['application/xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify], ['application/x-www-form-urlencoded', qsParse, qsStringify]]).forEach(function (b) {
        var m = b[0]
        it('should not fail to produce valid ' + m, function (done) {
          var req = {
            accepts: function () {
              return m
            }
          }
          var res = {
            type: function (t) {
              assert.equal(t, m)
            },
            status: function (s) {
              assert.equal(s, Response.CREATED)
            },
            end: function (resp) {
              var parsed = b[1](resp)
              assert.ok(parsed)
              if (/xml/.test(m)) {
                parsed = parsed.response
              }
              assert.equal(b[2](parsed), b[2](data))
              done()
            }
          }
          Response.create(req, res)(null, data)
        })
      })
    })
    describe('with error', function () {
      ;([['application/json', jsonParse, jsonStringify], ['text/xml', xmlParse, xmlStringify], ['application/xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify], ['application/x-www-form-urlencoded', qsParse, qsStringify]]).forEach(function (b) {
        var m = b[0]
        it('should not fail to error in ' + m, function (done) {
          var testMessage = 'find me'
          var req = {
            accepts: function () {
              return m
            }
          }
          var res = {
            type: function (t) {
              assert.equal(t, m)
            },
            status: function (s) {
              assert.equal(s, Response.SERVER_ERROR)
            },
            end: function (resp) {
              var parsed = b[1](resp)
              assert.ok(parsed)
              if (/xml/.test(m)) {
                parsed = parsed.response
              }
              assert.ok(parsed.error.indexOf(testMessage) >= 0)
              assert.equal(testMessage, parsed.message)
              done()
            }
          }
          Response.create(req, res)(new Error(testMessage))
        })
      })
    })
  })
  describe('read', function () {
    describe('with data', function () {
      ;([['application/json', jsonParse, jsonStringify], ['text/xml', xmlParse, xmlStringify], ['application/xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify], ['application/x-www-form-urlencoded', qsParse, qsStringify]]).forEach(function (b) {
        var m = b[0]
        it('should not fail to produce valid ' + m, function (done) {
          var req = {
            accepts: function () {
              return m
            }
          }
          var res = {
            type: function (t) {
              assert.equal(t, m)
            },
            status: function (s) {
              assert.equal(s, Response.FOUND)
            },
            end: function (resp) {
              var parsed = b[1](resp)
              assert.ok(parsed)
              if (/xml/.test(m)) {
                parsed = parsed.response
              }
              assert.equal(b[2](parsed), b[2](data))
              done()
            }
          }
          Response.read(req, res)(null, data)
        })
      })
    })
    describe('with error', function () {
      ;([['application/json', jsonParse, jsonStringify], ['text/xml', xmlParse, xmlStringify], ['application/xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify], ['application/x-www-form-urlencoded', qsParse, qsStringify]]).forEach(function (b) {
        var m = b[0]
        it('should not fail to error in ' + m, function (done) {
          var testMessage = 'find me'
          var req = {
            accepts: function () {
              return m
            }
          }
          var res = {
            type: function (t) {
              assert.equal(t, m)
            },
            status: function (s) {
              assert.equal(s, Response.SERVER_ERROR)
            },
            end: function (resp) {
              var parsed = b[1](resp)
              assert.ok(parsed)
              if (/xml/.test(m)) {
                parsed = parsed.response
              }
              assert.ok(parsed.error.indexOf(testMessage) >= 0)
              assert.equal(testMessage, parsed.message)
              done()
            }
          }
          Response.read(req, res)(new Error(testMessage))
        })
      })
    })
  })
  describe('update', function () {
    describe('with data', function () {
      ;([['application/json', jsonParse, jsonStringify], ['text/xml', xmlParse, xmlStringify], ['application/xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify], ['application/x-www-form-urlencoded', qsParse, qsStringify]]).forEach(function (b) {
        var m = b[0]
        it('should not fail to produce valid ' + m, function (done) {
          var req = {
            accepts: function () {
              return m
            }
          }
          var res = {
            type: function (t) {
              assert.equal(t, m)
            },
            status: function (s) {
              assert.equal(s, Response.UPDATED)
            },
            end: function (resp) {
              var parsed = b[1](resp)
              assert.ok(parsed)
              if (/xml/.test(m)) {
                parsed = parsed.response
              }
              assert.equal(b[2](parsed), b[2](data))
              done()
            }
          }
          Response.update(req, res)(null, data)
        })
      })
    })
    describe('with error', function () {
      ;([['application/json', jsonParse, jsonStringify], ['text/xml', xmlParse, xmlStringify], ['application/xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify], ['application/x-www-form-urlencoded', qsParse, qsStringify]]).forEach(function (b) {
        var m = b[0]
        it('should not fail to error in ' + m, function (done) {
          var testMessage = 'find me'
          var req = {
            accepts: function () {
              return m
            }
          }
          var res = {
            type: function (t) {
              assert.equal(t, m)
            },
            status: function (s) {
              assert.equal(s, Response.SERVER_ERROR)
            },
            end: function (resp) {
              var parsed = b[1](resp)
              assert.ok(parsed)
              if (/xml/.test(m)) {
                parsed = parsed.response
              }
              assert.ok(parsed.error.indexOf(testMessage) >= 0)
              assert.equal(testMessage, parsed.message)
              done()
            }
          }
          Response.update(req, res)(new Error(testMessage))
        })
      })
    })
  })
  describe('delete', function () {
    ;([['application/json', jsonParse, jsonStringify], ['text/xml', xmlParse, xmlStringify], ['application/xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify], ['application/x-www-form-urlencoded', qsParse, qsStringify]]).forEach(function (b) {
      var m = b[0]
      it('should not fail with' + m, function (done) {
        var req = {
          accepts: function () {
            return m
          }
        }
        var res = {
          type: function (t) {
            assert.equal(t, m)
          },
          status: function (s) {
            assert.equal(s, Response.DELETED)
          },
          end: function (resp) {
            assert.ok(!resp)
            done()
          }
        }
        Response.delete(req, res)(null, data)
      })
    })
    ;([['application/json', jsonParse, jsonStringify], ['text/xml', xmlParse, xmlStringify], ['application/xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify], ['application/x-www-form-urlencoded', qsParse, qsStringify]]).forEach(function (b) {
      var m = b[0]
      it('should not fail to error with' + m, function (done) {
        var testMessage = 'find me'
        var req = {
          accepts: function () {
            return m
          }
        }
        var res = {
          type: function (t) {
            assert.equal(t, m)
          },
          status: function (s) {
            assert.equal(s, Response.SERVER_ERROR)
          },
          end: function (resp) {
            var parsed
            if (/xml/.test(m)) {
              parsed = b[1](resp).response
            } else {
              parsed = b[1](resp)
            }
            assert.ok(parsed)
            assert.ok(parsed.error.indexOf(testMessage) >= 0)
            assert.equal(testMessage, parsed.message)
            done()
          }
        }
        Response.delete(req, res)(new Error(testMessage))
      })
    })
  })
  describe('find', function () {
    it('should handle 0 pageSize', function (done) {
      Response.find({
        accepts: function () {
          return 'application/json'
        },
        param: function (p) {
          return 0
        }
      }, {
        status: function (status) {
          assert.equal(status, Response.FOUND)
        },
        type: function () {},
        end: function (body) {
          var response = JSON.parse(body)
          assert.ok(!response.maxPage, 'should not have a maxPage')
          assert.equal(response.pageSize, 0)
          assert.equal(response.results.length, 0)
          done()
        }
      })(null, [])
    })
    describe('with data', function () {
      ;([['text/plain', jsonParse, jsonStringify], ['application/json', jsonParse, jsonStringify], ['text/xml', xmlParse, xmlStringify], ['application/xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify]]).forEach(function (b) {
        var m = b[0]
        it('should not fail to produce valid ' + m, function (done) {
          var req = {
            accepts: function () {
              return m
            },
            param: function () {}
          }
          var res = {
            type: function (t) {
              assert.equal(t, m)
            },
            status: function (s) {
              assert.equal(s, Response.FOUND)
            },
            end: function (resp) {
              var parsed = b[1](resp)
              if (/xml/.test(m)) {
                assert.ok(parsed.response.results)
                assert.equal(parsed.response.results.length, 2)
              } else if (/plain/.test(m)) {
                // no results if plain
                assert.equal(JSON.stringify(parsed), JSON.stringify([ data, data ]))
              } else {
                assert.ok(parsed.results)
                assert.equal(b[2](parsed.results), b[2]([ data, data ]))
              }
              done()
            }
          }
          Response.find(req, res)(null, [ data, data ])
        })
      })
    })
    describe('with error', function () {
      ;([['application/json', jsonParse, jsonStringify], ['text/xml', xmlParse, xmlStringify], ['application/xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify]]).forEach(function (b) {
        var m = b[0]
        it('should not fail to error in ' + m, function (done) {
          var testMessage = 'find me'
          var req = {
            accepts: function () {
              return m
            },
            param: function () {}
          }
          var res = {
            type: function (t) {
              assert.equal(t, m)
            },
            status: function (s) {
              assert.equal(s, Response.SERVER_ERROR)
            },
            end: function (resp) {
              var parsed = b[1](resp)
              assert.ok(parsed)
              if (/xml/.test(m)) {
                parsed = parsed.response
              }
              assert.ok(parsed.error.indexOf(testMessage) >= 0)
              assert.equal(testMessage, parsed.message)
              done()
            }
          }
          Response.find(req, res)(new Error(testMessage))
        })
      })
    })
  })
})
