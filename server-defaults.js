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
  }
}
