var mongoose = require('mongoose')
var path = require('path')

function getDestination (req, file, cb) {
  cb(null, path.join(req.path, file.fieldname, file.originalname))
}

function GridFsStorage (opts) {
  this.getDestination = (opts.destination || getDestination)
}

GridFsStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  // normal options, plus we getDestination to supply (optional) id
  this.getDestination(req, file, function (err, path, id) {
    if (err) return cb(err)
    var gfs = mongoose.gridFs
    var writestream = gfs.createWriteStream({
      _id: id,
      filename: path,
      content_type: file.mimetype
    })
    file.stream.pipe(writestream)
    writestream.on('error', cb)
    writestream.on('finish', function () {
      cb(null, {
        path: path,
        id: writestream.id,
        size: writestream.bytesWritten
      })
    })
  })
}

GridFsStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  var gfs = mongoose.gridFs
  gfs.remove({
    filename: file.path
  }, cb)
}

module.exports = function (opts) {
  return new GridFsStorage(opts)
}
