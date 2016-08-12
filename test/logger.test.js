/* global describe, it */
var path = require('path')
var assert = require('assert')
var logger = require(path.resolve('lib', 'logger'))
var filename = path.join(path.sep, 'tmp', 'test.log')
var filename2 = path.join(path.sep, 'tmp', 'test2.log')
var fs = require('fs')
var deleteFile = function (filename) {
  try {
    fs.unlinkSync(filename)
  } catch (e) {
  }
}
var touchFile = function (filename) {
  fs.writeFileSync(filename, '')
}
describe(path.basename(__filename), function () {
  it('should be able to rotate', function (done) {
    var i = 0
    deleteFile(filename)
    deleteFile(filename2)
    touchFile(filename)
    logger.yaktorInit({
      log: {
        filename: filename
      }
    })
    var watcher = fs.watch(filename)
    watcher.once('change', function () {
      watcher.close()
      var firstLog = fs.readFileSync(filename).toString()
      assert(firstLog, 'error: LINE 0')
      fs.renameSync(filename, filename2)
      touchFile(filename)
      logger.error('LINE', i++)
      process.on('SIGHUP', function () {
        var watcher = fs.watch(filename).once('change', function () {
          watcher.close()
          var secondLog = fs.readFileSync(filename).toString()
          assert(secondLog, 'error: LINE 0')
          done()
        })
        logger.error('LINE', i++)
      })
      process.emit('SIGHUP')
    })
    logger.error('LINE', i++)
  })
})
