var defer = require('config/defer').deferConfig // see https://github.com/lorenwest/node-config/wiki/Configuration-Files#javascript-module---js

var config = {
  yaktor: {
    log: {
      filename: null, // set to a path to enable logging
      level: 'info', // values:  silly, debug, info, warn, error
      stdout: true // set to false to disable logging to stdout
    },
    mongo: {
      host: 'localhost',
      port: 27017,
      db: 'yaktor',
      options: {
        server: {
          auto_reconnect: true,
          numberOfRetries: 1000000
        }
      }
    },
    amqp: {
      force: false,
      options: {
        connection: {
          host: 'localhost',
          port: 5672,
          heartbeat: 55
        }
      }
    },
    servers: {
      DEFAULT: { // see yaktor/config/servers/DEFAULT.js for all possible settings
        protocol: 'http',
        port: 3000
      }
    }
  }
}

module.exports = config
