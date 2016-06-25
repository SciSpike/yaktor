var fs = require('fs')
var path = require('path')

var fileReg = /(.*)\..+/

fs.readdirSync(__dirname).forEach(function (file) {
  var pathname = path.join(__dirname, file)
  if (__filename !== pathname) {
    module.exports[ file.match(fileReg)[ 1 ] ] = require(pathname)
  }
})
