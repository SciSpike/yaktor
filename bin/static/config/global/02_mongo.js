var logger = require('yaktor/logger')
logger.info(__filename)
var mongoose = require('mongoose')
var GridFs
try {
  GridFs = require('gridfs-stream')
  GridFs.mongo = mongoose.mongo
} catch (e) {
  logger.warn('gridfs not found, skipping.')
}
/* jshint eqnull:true */
module.exports = function (yaktor, done) {
  var host = yaktor.mongo.host
  var port = yaktor.mongo.port
  var db = yaktor.mongo.db
  var options = yaktor.mongo.options

  require('mongoose-pagination')
  var f1nU = mongoose.Model.findOneAndUpdate
  // Monkey Patch for update existing doc.
  mongoose.Model.findOneAndUpdate = function (q, doc) {
    if (doc != null && doc.toObject != null) {
      var newDoc = doc.toObject()
      delete newDoc._id
      arguments[ 1 ] = newDoc
      f1nU.apply(this, arguments)
    } else {
      f1nU.apply(this, arguments)
    }
  }

  if (mongoose.connection._readyState !== 0) return done()

  var opened = false

  mongoose.connection.on('error', function (err) {
    // if we've never been opened before then we must call this code when opened
    if (!opened) {
      mongoose.connection.db.collection('test').count(function (err) {
        if (err) return done(err)
        mongoose.connection.onOpen()
      })
    }
    done(err)
  })

  mongoose.connection.on('open', function (err) {
    opened = true
    if (GridFs && !mongoose.gridFs) {
      mongoose.gridFs = new GridFs(mongoose.connection.db)
    }
    done(err)
  })

  mongoose.connect('mongodb://' + host + ':' + port + '/' + db, options)
}
