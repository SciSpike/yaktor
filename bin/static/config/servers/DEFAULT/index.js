var path = require('path')
var fs = require('fs')
var async = require('async')

var settings = {
  express: {
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
    views: 'views/ejs',
    viewCache: null,
    viewEngine: null,
    xPoweredBy: null
  },
  host: {
    options: {
      // use this object to configure https if protocol is https
    },
    protocol: 'http', // if https, use options above
    prefix: '', // protocol+prefix supercedes protocol+host+port
    hostname: 'localhost',
    port: 3000
  },
  path: {
    routesPath: 'routes', // TODO: remove when routes/<serverName> directories implemented
    // TODO: routes: 'routes/DEFAULT',
    actionsPath: 'actions' // TODO: remove when actions/<serverName> directories implemented
    // TODO: actions: 'actions/DEFAULT'
  },
  favicon: {
    basedir: 'public',
    filename: 'favicon.png'
  },
  mqtt: {
    path: 'mqtt' // slash will be prepended if not present
  },
  gossip: {
    port: 0, // if 0, server will use host.port + portOffset
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
  i18n: {
    locales: [ 'en', 'en_US' ]
  }
}

fs.readdirSync(__dirname).forEach(function (file) {
  var pathname = path.join(__dirname, file)
  if (!fs.lstatSync(pathname).isDirectory()) return

  if (settings[ file ]) throw new Error('cannot use configuration name "' + file + '" -- already used in server settings')
  settings[ file ] = require(pathname)
})

var regex = /\.js$/
module.exports = {
  settings: settings,
  init: function (serverName, app, done) {
    // NOTE: Sorting is required, due to the fact that no order is guaranteed
    //       by the system for a directory listing.  Sorting allows initializers
    //       to be prefixed with a number, and loaded in a pre-determined order.
    var files = fs.readdirSync(__dirname).sort()
    async.forEachSeries(files, function (file, next) {
      var pathname = path.join(__dirname, file)
      if (fs.lstatSync(pathname).isDirectory() || file === 'index.js' || !regex.test(file)) return next()

      try {
        var initializer = require(pathname)
        if (typeof initializer === 'function') {
          initializer(serverName, app, next)
        } else {
          // requiring the initializer is sufficient to invoke it, next immediately.
          next()
        }
      } catch (e) {
        next(e)
      }
    }, done)
  }
}
