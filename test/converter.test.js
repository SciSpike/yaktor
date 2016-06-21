/* global describe, it */
var path = require('path')
var assert = require('assert')
var async = require('async')
require('mongoose-shortid-nodeps')
require(path.resolve('src-gen', 'test'))
var converter = require(path.resolve('app', 'services', 'conversionService'))
var mongoose = require('mongoose')
var mockgoose = require('mockgoose')
var proxyquire = require('proxyquire')
mockgoose(mongoose)
var ObjectId = mongoose.Types.ObjectId
var proxy = {
  'mongoose': Global(mongoose)
}
proxy[ path.resolve('node_modules', 'yaktor', 'app', 'services', 'conversionService') ] = Global(converter)
proxyquire(path.resolve('conversations', 'types'), proxy)

function Global (m) {
  m[ '@noCallThru' ] = true
  m[ '@global' ] = true
  return m
}

describe('converter', function () {
  it('should allow [Number] [Date] [Integer]', function (done) {
    var dto = {
      numerics: [ 1.0, 2.2, '3.0' ],
      integers: [ 1, 2, '3' ],
      strings: [ 'sdf sdfsdf', '1', '3' ],
      dates: [ new Date(1), new Date(2), new Date().getTime() ]
    }
    async.waterfall([
      async.apply(converter.toQuery, 'test.Z', dto)
    ], function (err, d) {
      assert.ifError(err)
      assert.deepEqual(d.numerics, dto.numerics)
      assert.deepEqual(d.integers, dto.integers)
      assert.deepEqual(d.strings, dto.strings)
      assert.deepEqual(d.dates, dto.dates)
      done()
    })
  })
  it('should pass through $ operators', function (done) {
    var dto = {
      az: { $neq: '' }
    }

    async.waterfall([
      async.apply(converter.toQuery, 'test.D', dto)
    ], function (err, d) {
      assert.ifError(err)
      assert.equal(d.az, dto.az)
      done()
    })
  })

  it('should include all fields of a query', function (done) {
    var az = {
      _id: new ObjectId()
    }
    var subOne = 'one'
    var subMany = 'many'
    var subs = '123456789012123456789012'
    var yandZ = new ObjectId().toString()
    var m = new ObjectId().toString()
    var dto = {
      _id: new ObjectId().toString(),
      az: az._id.toString(),
      subs: subs,
      subType: {
        field: subOne,
        subSubType: {
          field: subMany
        }
      },
      subTypes: [ {
        field: subMany,
        subSubType: {
          field: subMany
        }
      } ],
      yandZ: yandZ,
      m: m,
      m2: { _id: m }
    }

    async.waterfall([
      async.apply(converter.toQuery, 'test.D', dto)
    ], function (err, d) {
      assert.ifError(err)
      assert.equal(d._id, dto._id)
      assert.equal(d.az.toString(), az._id.toString())
      assert.equal(d.subs.toString(), subs.toString())
      assert.equal(d.yandZ.toString(), yandZ.toString())
      assert.equal(d.m, m)
      assert.equal(d.m2, m)
      assert.equal(d[ 'subTypes.field' ], subMany)
      assert.equal(d[ 'subType.field' ], subOne)
      done()
    })
  })
  it('should include all fields of a query of default mapping', function (done) {
    var az = {
      _id: new ObjectId()
    }
    var subOne = 'one'
    var subMany = 'many'
    var subs = '123456789012123456789012'
    var yandZ = new ObjectId().toString()
    var m = new ObjectId().toString()
    var dto = {
      _id: new ObjectId().toString(),
      az: az._id.toString(),
      subs: subs,
      subType: {
        field: subOne,
        subSubType: {
          field: subMany
        }
      },
      subTypes: [ {
        field: subMany,
        subSubType: {
          field: subMany
        }
      } ],
      yandZ: yandZ,
      m: m,
      m2: { _id: m }
    }

    async.waterfall([
      async.apply(converter.toQuery, 'test.D2', dto)
    ], function (err, d) {
      assert.ifError(err)
      assert.equal(d._id, dto._id)
      assert.equal(d.az.toString(), az._id.toString())
      assert.equal(d.subs.toString(), subs.toString())
      assert.equal(d.yandZ.toString(), yandZ.toString())
      assert.equal(d.m, m)
      assert.equal(d.m2, m)
      assert.equal(d[ 'subTypes.field' ], subMany)
      assert.equal(d[ 'subType.field' ], subOne)
      done()
    })
  })
  it('should pass out a regex with /../ style value', function (done) {
    var dto = { title: '/test/', sid: '/id/' }
    async.waterfall([
      async.apply(converter.toQuery, 'test.A', dto)
    ], function (err, d) {
      assert.ifError(err)
      assert.ok(d._id instanceof RegExp, 'd.sid should be a RegExp')
      assert.ok(d.title instanceof RegExp, 'd.title should be a RegExp')
      done()
    })
  })
  it('should include all fields of a query with many subTypes', function (done) {
    var az = {
      _id: new ObjectId()
    }
    var subOne = 'one'
    var subMany = 'many'
    var subs = '123456789012123456789012'
    var yandZ = new ObjectId().toString()
    var m = new ObjectId().toString()
    var dto = {
      _id: new ObjectId().toString(),
      az: az._id.toString(),
      subs: subs,
      subType: {
        field: subOne,
        subSubType: {
          field: subMany
        }
      },
      subTypes: [ {
        field: subMany,
        subSubType: {
          field: subMany
        }
      }, {
        field: subMany,
        subSubType: {
          field: subMany
        }
      } ],
      yandZ: yandZ,
      m: m,
      isActive: true
    }

    async.waterfall([
      async.apply(converter.toQuery, 'test.D', dto)
    ], function (err, d) {
      assert.ifError(err)
      assert.equal(d._id, dto._id)
      assert.equal(d.az.toString(), az._id.toString())
      assert.equal(d.subs.toString(), subs.toString())
      assert.equal(d.yandZ.toString(), yandZ.toString())
      assert.equal(d.m, m)
      assert.equal(d[ 'subTypes.0.field' ], subMany)
      assert.equal(d[ 'subType.field' ], subOne)
      // TODO make this test work
      // assert.ok(!d.isActive)
      done()
    })
  })
  it('should round trip from dto', function (done) {
    var az = {
      _id: new ObjectId()
    }
    var subOne = 'one'
    var subMany = 'many'
    var subs = '123456789012123456789012'
    var yandZ = new ObjectId()
    var m = new ObjectId()
    var dto = {
      az: az,
      subs: subs,
      subType: {
        field: subOne,
        subSubType: {
          field: subMany
        }
      },
      subTypes: [ {
        field: subMany,
        subSubType: {
          field: subMany
        }
      } ],
      yandZ: yandZ,
      m: m
    }
    async.waterfall([
      async.apply(converter.fromDto, 'test.D', dto),
      function (d, cb) {
        assert.equal(d.az.toString(), az._id.toString())
        d.save(function () {
          cb(null, d)
        })
      },
      async.apply(converter.toDto, 'test.D')
    ], function (err, d) {
      assert.ifError(err)
      assert.equal(d.az.toString(), az._id.toString())
      assert.equal(d.subs.toString(), subs.toString())
      assert.equal(d.yandZ.toString(), yandZ.toString())
      assert.equal(d.m, m)
      assert.equal(d.subTypes[ 0 ].field, subMany)
      assert.equal(d.__t, 'D', 'should have a __t')
      assert.ok(!d.subType._id, 'mongoose only inserts _ids into subType arrays')
      assert.equal(d.subType.field, subOne)
      done()
    })
  })
})
