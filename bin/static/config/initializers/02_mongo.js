var logger = require('yaktor/lib/logger')
logger.silly(__filename)
var mongoose = require('mongoose')
require('mongoose-shortid')
var GridFs
try {
  GridFs = require('gridfs-stream')
  GridFs.mongo = mongoose.mongo
} catch (e) {
  logger.warn('gridfs not found, skipping.')
}
/* jshint eqnull:true */
module.exports = function (cb) {
  var app = this
  var cfg = app.get('serverConfig')

  var host = cfg.mongo.host
  var port = cfg.mongo.port
  var db = cfg.mongo.db
  var options = cfg.mongo.options

  require('mongoose-pagination')
  var f1nU = mongoose.Model.findOneAndUpdate
  // Monkey Patch for update existing doc.
  mongoose.Model.findOneAndUpdate = function (q, doc) {
    if (doc != null && doc.toObject != null) {
      var newDoc = doc.toObject()
      delete newDoc._id
      // This line may cause JSHint warning. However, it is an optimization that is safe.
      /* jshint ignore:start */
      arguments[ 1 ] = newDoc
      /* jshint ignore:end */
      f1nU.apply(this, arguments)
    } else {
      f1nU.apply(this, arguments)
    }
  }

  if (mongoose.connection._readyState === 0) {
    logger.info('???dev???')
    var opened = false
    mongoose.connection.on('error', function () { // eslint-disable-line handle-callback-err
      // if we've never been opened before then we must call this code when opened
      if (!opened) {
        mongoose.connection.db.collection('test').count(function () { // eslint-disable-line handle-callback-err
          mongoose.connection.onOpen()
        })
      }
    })
    mongoose.connection.on('open', function (err) {
      opened = true
      if (GridFs && !mongoose.gridFs) {
        mongoose.gridFs = new GridFs(mongoose.connection.db)
      }
      cb(err)
    })
    mongoose.connect('mongodb://' + host + ':' + port + '/' + db, options)
  } else {
    cb()
  }
}
