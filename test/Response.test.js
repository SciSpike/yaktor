/* global describe, it */
var path = require('path')
var assert = require('assert')

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
    it('should not fail to produce valid json', function (done) {
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
          assert.equal(s, Response.CREATED)
        },
        end: function (resp) {
          var parsed = JSON.parse(resp)
          assert.ok(parsed)
          assert.equal(JSON.stringify(parsed), JSON.stringify(data))
          done()
        }
      }
      Response.create(req, res)(null, data)
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
    it('should not fail to produce valid json', function (done) {
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
          assert.equal(s, Response.FOUND)
        },
        end: function (resp) {
          var parsed = JSON.parse(resp)
          assert.ok(parsed)
          assert.equal(JSON.stringify(parsed), JSON.stringify(data))
          done()
        }
      }
      Response.read(req, res)(null, data)
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
    it('should not fail to produce valid json', function (done) {
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
          assert.equal(s, Response.UPDATED)
        },
        end: function (resp) {
          var parsed = JSON.parse(resp)
          assert.ok(parsed)
          assert.equal(JSON.stringify(parsed), JSON.stringify(data))
          done()
        }
      }
      Response.update(req, res)(null, data)
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
    it('should not fail', function (done) {
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
          assert.equal(s, Response.DELETED)
        },
        end: function (resp) {
          assert.ok(!resp)
          done()
        }
      }
      Response.delete(req, res)(null, data)
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
      Response.delete(req, res)(new Error(testMessage))
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
    it('should not fail to produce a valid json array', function (done) {
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
          assert.equal(s, Response.FOUND)
        },
        end: function (resp) {
          var parsed = JSON.parse(resp)
          assert.ok(parsed.results)
          assert.equal(JSON.stringify(parsed.results), JSON.stringify([ data ]))
          done()
        }
      }
      Response.find(req, res)(null, [ data ])
    })
    it('should not fail to produce a valid xml array', function (done) {
      var m = 'application/xhtml+xml'
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
          var parsed = require('nice-xml').parse(resp)

          // xml is so different I don't really care
          assert.ok(parsed.response.results)
          assert.ok(parsed.response.results.length === 2)
          done()
        }
      }
      Response.find(req, res)(null, [ data, data ])
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
