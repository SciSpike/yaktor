// To create your own default configuration, replace the code below with your own values
var path = require('path')

var config = {
  yaktor: {
    servers: {
      DEFAULT: {}
    }
  }
}

var settings = require(path.resolve('config', 'global')).settings
Object.keys(settings).forEach(function (key) {
  config.yaktor[ key ] = settings[ key ]
})

settings = require(path.resolve('config', 'servers', 'DEFAULT')).settings
Object.keys(settings).forEach(function (key) {
  config.yaktor.servers.DEFAULT[ key ] = settings[ key ]
})

module.exports = config
