var path = require('path')
var fs = require('fs')

var servers = {}
fs.readdirSync(__dirname).forEach(function (file) {
  var pathname = path.join(__dirname, file)
  if (!fs.lstatSync(pathname).isDirectory()) return

  servers[ file ] = require(pathname)
})

module.exports = servers
