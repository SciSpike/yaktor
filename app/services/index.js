var fs = require('fs')
var path = require('path')
var fileReg = /\.[^.]+/

fs.readdirSync(__dirname).forEach(function (file) {
  if (__filename !== file) {
    module.exports[ file.replace(fileReg, '') ] = require(path.join(__dirname, file))
  }
})
