var logger = require('../../logger')

module.exports = {
  setupSession: function (channel, providerChannel, urlScheme) {
    return function (req, res, next) {
      // clear session
      req.session.regenerate(function () { // eslint-disable-line handle-callback-err
        logger.debug('init session:%s; on path: %s', req.sessionID, req.path)
        req.session.channel = channel
        req.session.providerChannel = providerChannel
        req.session.urlScheme = urlScheme
        next()
      })
    }
  },
  toQuery: function (map, callback) {
    var query = ''
    for (var qKey in map) {
      query = query + qKey + '=' + map[ qKey ] + '&'
    }
    callback(null, query)
  }
}
