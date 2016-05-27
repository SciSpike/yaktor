var cp = require('child_process')
var path = require('path')

var startChild = function (file, data, done) {
  var start = null
  var n = cp.fork(path.resolve(file))
  n.on('message', function (m) {
    start = start || new Date().getTime()
    n.send(data)
  })

  n.on('exit', function (m) {
    done(null, start)
  })

  return n
}

module.exports = function (file, data, callback) {
  return startChild(file, data, function (err, start) {
    var end = new Date().getTime()
    var time = (end - start)
    callback(err, time)
  })
}
