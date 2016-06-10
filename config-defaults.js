// default yaktor configuration values

module.exports = {
  log: {
    filename: '',
    level: 'info',
    stdout: true
  },
  enginePath: './engine',
  conversations: {
    basedir: 'conversations',
    types: 'types',
    modules: 'js'
  },
  generator: {
    basedir: 'src-gen',
    models: 'modelAll'
  },
  servers: {
    DEFAULT: {
      // see http://expressjs.com/en/4x/api.html#app.settings.table
      caseSensitiveRouting: null,
      etag: null,
      jsonpCallbackName: null,
      jsonReplacer: null,
      jsonSpaces: null,
      queryParser: null,
      stringRouting: null,
      subdomainOffset: null,
      trustProxy: null,
      viewCache: null,
      viewEngine: null,
      xPoweredBy: null,
      views: 'views/ejs',
      // end of well-known expressjs app settings
      views_: { // trailing underscore to differentiate from expressjs's "views"
        basedir: 'views', // keep this in sync with "views"!
        index: 'index.html'
      },
      protocol: 'http',
      prefix: '',
      hostname: 'localhost',
      port: 3000,
      initializersPath: 'config/initializers',
      routesPath: 'routes',
      actionsPath: 'actions',
      mqtt: {
        path: 'mqtt' // slash will be prepended if not present
      },
      gossip: {
        portOffset: 1000
      },
      session: {
        maxAgeMillis: 72000000, // (20 hours)
        secret: 'a very unique secret that is hard to guess'
      },
      locales: [ 'en', 'en_US' ],
      favicon: {
        basedir: 'public',
        filename: 'favicon.png'
      },
      'static': {
        basedir: 'public'
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
      cassandra: {
        enable: false,
        hosts: 'localhost', // comma-delimited hostname string
        keyspace: 'yaktor',
        port: 9042 // all hosts must use the same port
      }
    }
  }
}
