var path = require('path')
var fs = require('fs')

var servers = {}
fs.readdirSync(__dirname).forEach(function (file) {
  var filePath = path.join(__dirname, file)
  if (!fs.lstatSync(filePath).isDirectory()) return

  servers[ file ] = require(filePath);
});

module.exports = servers;
