module.exports = {
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
  protocol: 'http',
  prefix: '',
  hostname: 'localhost',
  port: 3000,
  // TODO: initializersPath: 'config/servers/DEFAULT',
  routesPath: 'routes', // TODO: routes/DEFAULT
  actionsPath: 'actions', // TODO: actions/DEFAULT
  mqtt: {
    path: 'mqtt' // slash will be prepended if not present
  },
  gossip: {
    port: 0, // if 0, server will use port + portOffset
    portOffset: 1000 // see line above
  },
  session: { // see config/servers/.../04_session.js -- this configures a Mongoose session store
    enable: false,
    config: {
      resave: true,
      saveUninitialized: true,
      secret: 'a very unique secret that is hard to guess',
      key: 'connect.sid',
      cookie: {
        httpOnly: false,
        maxAge: 1000 * 20 * 60 * 60
      }
    }
  },
  locales: [ 'en', 'en_US' ],
  favicon: {
    basedir: 'public',
    filename: 'favicon.png'
  }
}
