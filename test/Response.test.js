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
  describe('BadRequest', function () {
    var req = {
      accepts: function () {},
      param: function () {}
    }
    describe('create', function () {
      it('should be a BAD_REQUEST when given a BadRequest -error-', function (done) {
        var error = new BadRequest()
        Response.create(req, {
          status: function (status) {
            assert.equal(status, Response.BAD_REQUEST)
            done()
          },
          type: function () {},
          end: function () {}
        })(error)
      })
    })
    describe('read', function () {
      it('should be a BAD_REQUEST when given a BadRequest -error-', function (done) {
        var error = new BadRequest()
        Response.read(req, {
          status: function (status) {
            assert.equal(status, Response.BAD_REQUEST)
            done()
          },
          type: function () {},
          end: function () {}
        })(error)
      })
    })
    describe('update', function () {
      it('should be a BAD_REQUEST when given a BadRequest -error-', function (done) {
        var error = new BadRequest()
        Response.update(req, {
          status: function (status) {
            assert.equal(status, Response.BAD_REQUEST)
            done()
          },
          type: function () {},
          end: function () {}
        })(error)
      })
    })
    describe('delete', function () {
      it('should be a BAD_REQUEST when given a BadRequest -error-', function (done) {
        var error = new BadRequest()
        Response.delete(req, {
          status: function (status) {
            assert.equal(status, Response.BAD_REQUEST)
            done()
          },
          type: function () {},
          end: function () {}
        })(error)
      })
    })
    describe('find', function () {
      it('should be a BAD_REQUEST when given a BadRequest -error-', function (done) {
        var error = new BadRequest()
        Response.find(req, {
          status: function (status) {
            assert.equal(status, Response.BAD_REQUEST)
            done()
          },
          type: function () {},
          end: function () {}
        })(error)
      })
    })
  })
  describe('create', function () {
    ;([['application/json', jsonParse, jsonStringify], ['text/html', xmlParse, xmlStringify], ['application/xhtml+xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify], ['application/x-www-form-urlencoded', qsParse, qsStringify]]).forEach(function (b) {
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
            if (/xml|html/.test(m)) {
              parsed = parsed.response
            }
            assert.equal(b[2](parsed), b[2](data))
            done()
          }
        }
        Response.create(req, res)(null, data)
      })
    })

    it('should not fail to error', function (done) {
      var testMessage = 'find me'
      var m = 'application/json'
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
          var parsed = JSON.parse(resp)
          assert.ok(parsed)
          assert.ok(parsed.error.indexOf(testMessage) >= 0)
          done()
        }
      }
      Response.create(req, res)(new Error(testMessage))
    })
  })
  describe('read', function () {
    ;([['application/json', jsonParse, jsonStringify], ['text/html', xmlParse, xmlStringify], ['application/xhtml+xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify], ['application/x-www-form-urlencoded', qsParse, qsStringify]]).forEach(function (b) {
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
            if (/xml|html/.test(m)) {
              parsed = parsed.response
            }
            assert.equal(b[2](parsed), b[2](data))
            done()
          }
        }
        Response.read(req, res)(null, data)
      })
    })
    it('should not fail to error', function (done) {
      var testMessage = 'find me'
      var m = 'application/json'
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
          var parsed = JSON.parse(resp)
          assert.ok(parsed)
          assert.ok(parsed.error.indexOf(testMessage) >= 0)
          done()
        }
      }
      Response.read(req, res)(new Error(testMessage))
    })
  })
  describe('update', function () {
    ;([['application/json', jsonParse, jsonStringify], ['text/html', xmlParse, xmlStringify], ['application/xhtml+xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify], ['application/x-www-form-urlencoded', qsParse, qsStringify]]).forEach(function (b) {
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
            if (/xml|html/.test(m)) {
              parsed = parsed.response
            }
            assert.equal(b[2](parsed), b[2](data))
            done()
          }
        }
        Response.update(req, res)(null, data)
      })
    })
    it('should not fail to error', function (done) {
      var testMessage = 'find me'
      var m = 'application/json'
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
          var parsed = JSON.parse(resp)
          assert.ok(parsed)
          assert.ok(parsed.error.indexOf(testMessage) >= 0)
          done()
        }
      }
      Response.update(req, res)(new Error(testMessage))
    })
  })
  describe('delete', function () {
    ;([['application/json', jsonParse, jsonStringify], ['text/html', xmlParse, xmlStringify], ['application/xhtml+xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify], ['application/x-www-form-urlencoded', qsParse, qsStringify]]).forEach(function (b) {
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
    ;([['application/json', jsonParse, jsonStringify], ['text/html', xmlParse, xmlStringify], ['application/xhtml+xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify]]).forEach(function (b) {
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
            if (/xml|html/.test(m)) {
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
    ;([['application/json', jsonParse, jsonStringify], ['text/html', xmlParse, xmlStringify], ['application/xhtml+xml', xmlParse, xmlStringify], ['application/x-yaml', yamlParse, yamlStringify], ['text/yaml', yamlParse, yamlStringify]]).forEach(function (b) {
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
            if (/xml|html/.test(m)) {
              assert.ok(parsed.response.results)
              assert.equal(parsed.response.results.length, 2)
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
    it('should not fail to error', function (done) {
      var testMessage = 'find me'
      var m = 'application/json'
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
          var parsed = JSON.parse(resp)
          assert.ok(parsed)
          assert.ok(parsed.error.indexOf(testMessage) >= 0)
          done()
        }
      }
      Response.find(req, res)(new Error(testMessage))
    })
    it('should not fail to produce a valid json array', function (done) {
      var m = 'text/plain'
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
          var parsed = JSON.parse(resp)
          assert.ok(parsed)
          assert.equal(JSON.stringify(parsed), JSON.stringify([ data ]))
          done()
        }
      }
      Response.find(req, res)(null, [ data ])
    })
  })
})
