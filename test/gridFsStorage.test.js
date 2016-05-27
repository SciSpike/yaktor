/* global describe, it */
var path = require('path')
var mongoose = require('mongoose')
var stream = require('stream')
var GridFsStorage = require(path.resolve('bin', 'static', 'lib', 'gridFsStorage'))
var assert = require('assert')
describe(path.basename(__filename), function () {
  it('save', function (cb) {
    var bufs = []
    var writeStream = new stream.PassThrough()
    writeStream.on('data', function (d) { bufs.push(d) })
    var id = 'id'
    mongoose.gridFs = {
      createWriteStream: function (options) {
        assert.ok(!options._id)
        writeStream.id = options._id || id
        return writeStream
      },
      createReadStream: function () {}
    }
    var gfs = new GridFsStorage({})
    var input = 'InputString'
    var filename = 'f.f'
    var fieldname = 'f'
    var path = 'p'
    // Initiate the source
    var fileStream = new stream.PassThrough()
    fileStream.end(new Buffer(input))

    gfs._handleFile({ path: path }, {
      mimetype: 'application/pdf',
      stream: fileStream,
      originalname: filename,
      fieldname: fieldname
    }, function (err, f) {
      assert.ifError(err)
      var buf = Buffer.concat(bufs)
      assert.equal(buf.toString(), input)
      assert.equal(f.id, id)
      cb()
    })
  })
})
