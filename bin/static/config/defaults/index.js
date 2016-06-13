var path = require('path')
var fs = require('fs')

var defaults = {}
fs.readdirSync(__dirname).forEach(function (file) {
  var filePath = path.join(__dirname, file)
  if (__filename === filePath || fs.lstatSync(filePath).isDirectory) return

  defaults[ file ] = require(filePath); // using filename as key prevents collision among config contributors
});

module.exports = defaults;
