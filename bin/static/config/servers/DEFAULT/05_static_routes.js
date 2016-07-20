var logger = require('yaktor/logger')
logger.info(__filename)
var path = require('path')
var fs = require('fs')
var util = require('util')
var serveStatic = require('serve-static')

module.exports = function (ctx, done) {
  var app = ctx.app
  app.use(serveStatic(path.resolve(path.join('node_modules', 'tv4'))))
  app.use(serveStatic(path.resolve('public')))

  // setup the error handling for development mode (prints the error stacktrace in browser)
  if (process.env.NODE_ENV === 'development') {
    app.use(require('errorhandler')())
    app.get('/dump', function (req, res) { // TODO: make configurable?
      var heapdump = require('heapdump')
      heapdump.writeSnapshot()
      res.end('thanks')
    })
  }
  // Convenience route for integrators to view all registered routes
  app.get('/__routes', function (req, res) { // TODO: make configurable?
    res.end(JSON.stringify(app.routes))
  })
  app.get('/reinit', function (req, res) { // TODO: make configurable?
    req.session.regenerate(function () { // eslint-disable-line handle-callback-err
      logger.debug('initialized session:%s', req.sessionID)
      if (req.param('redir')) {
        res.redirect(req.param('redir'))
      } else if (req.header('Referer')) {
        res.redirect(req.header('Referer'))
      } else {
        res.end('Initialized session: ' + req.sessionID)
      }
    })
  })
  app.get('/emitter.js', function (req, res) { // TODO: make configurable?
    var path = require.resolve('emitter-component')
    var stat = fs.statSync(path)
    var header = '(function(global){var exports=null,module = {exports:exports};'
    var trailer = ';exports=exports||module.exports;global.emitter=exports;})(this)'
    res.writeHead(200, {
      'Content-Type': 'text/javascript',
      'Content-Length': header.length + stat.size + trailer.length
    })
    var rs = fs.createReadStream(path)
    res.write(header)
    rs.pipe(res, false)
    rs.on('end', function () {
      res.end(trailer)
    })
  })

  app.engine('html', require('consolidate').underscore)
  app.engine('json', require('consolidate').underscore)
  app.engine('ejs', require('consolidate').underscore)

  var swaggerIndex = function (req, res) {
    fs.readFile(path.resolve('node_modules', 'swagger-ui', 'dist', 'index.html'), function (err, f) { // eslint-disable-line handle-callback-err
      f = f.toString().replace('"your-client-id"', '"1"')
      res.end(f)
    })
  }
  app.get('/swagger-ui/index.html', swaggerIndex) // TODO: make configurable?
  app.get('/swagger-ui', swaggerIndex) // TODO: make configurable?
  app.use('/swagger-ui', serveStatic(path.resolve('node_modules', 'swagger-ui', 'dist'))) // TODO: make configurable?
  var sprocessed = {}
  app.get('/swagger-api/:id', function (req, res, next) { // TODO: make configurable?
    if (!sprocessed[req.params.id]) {
      sprocessed[req.params.id]
      var serverPath = path.resolve('public/swagger_api/' + req.params.id)
      fs.readdirSync(serverPath).forEach(function (file) {
        var schema = require(path.join(serverPath, file))
        sprocessed[req.params.id] = sprocessed[req.params.id] || schema
        util._extend(sprocessed[req.params.id].paths, schema.paths)
        sprocessed[req.params.id].tags = sprocessed[req.params.id].tags.concat(schema.tags)
      })
      var server = require('yaktor').serverContexts[ req.params.id ]
      var host = server.host
      var schema = sprocessed[req.params.id]
      schema.schemes = [host.proto]
      schema.host = host.hostname + ':' + host.port
      var implicit = schema.securityDefinitions.implicit
      if (implicit) {
        implicit.authorizationUrl = implicit.authorizationUrl.replace(/<%=proto %>:\/\/<%=host %>/, server.urlPrefix)
      }
      var password = schema.securityDefinitions.password
      if (password) {
        password.tokenUrl = password.tokenUrl.replace(/<%=proto %>:\/\/<%=host %>/, server.urlPrefix)
      }
    }
    res.end(JSON.stringify(sprocessed[req.params.id]))
  })
  app.get('/', function (req, res) {
    res.render(path.resolve(path.join('views', 'index.html')), { // TODO: make configurable?
      locale: req.locale,
      sId: req.sessionID
    })
  })

  app.use(serveStatic(path.resolve('views'))) // TODO: make configurable?

  done()
}
