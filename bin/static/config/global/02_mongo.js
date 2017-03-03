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
  require('mongoose-pagination')
  var f1nU = mongoose.Model.findOneAndUpdate
  // Monkey Patch for update existing doc.
  mongoose.Model.findOneAndUpdate = function (q, doc) {
    if (doc != null && doc.toObject != null) {
      var newDoc = doc.toObject()
      delete newDoc._id
      arguments[1] = newDoc
      return f1nU.apply(this, arguments)
    } else {
      return f1nU.apply(this, arguments)
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

  var url = 'mongodb://'
  if (yaktor.mongo.username) {
    url += (encodeURIComponent(yaktor.mongo.username) + ':' + encodeURIComponent(yaktor.mongo.password) + '@')
  }
  var first = true
  var hostports = yaktor.mongo.hosts || []
  hostports.forEach(function (hostport) {
    if (hostport.host) {
      if (first) first = false
      else url += ','
      url += (hostport.host + ':' + Number(hostport.port || 27017))
    }
  })
  if (first) {
    return done(new Error('no mongo hosts configured'))
  }
  if (yaktor.mongo.db) {
    url += ('/' + yaktor.mongo.db)
  }
  first = true
  Object.keys(yaktor.mongo.options).forEach(function (key) {
    if (yaktor.mongo.options[key] === null) return
    if (first) {
      url += '?'
      first = false
    } else {
      url += '&'
    }
    url += (key + '=' + encodeURIComponent(yaktor.mongo.options[key]))
  })
  // redact password before logging
  var loggedUrl = url
  var matches = /^mongodb:\/\/(.*:)(.*@)(.*)$/.exec(loggedUrl)
  if (matches) {
    loggedUrl = 'mongodb://' + matches[1] + '<redacted>@' + matches[3]
  }
  logger.info('mongo connection url: ' + loggedUrl)

  mongoose.connect(url)
}
