var logger = require('yaktor/logger')
logger.silly(__filename)
var updateInterval = 60000 // TODO: make configurable?
var os = require('os')
var dns = require('dns')
var async = require('async')
var Gossipmonger = require('gossipmonger')
var ClusterSeed = require('mongoose').model('ClusterSeed')

module.exports = function (serverName, app, done) {
  var yaktor = app.yaktor
  var gPort = parseInt(app.getConfigVal('gossip.port')) ||
    parseInt(app.getConfigVal('host.port')) + parseInt(app.getConfigVal('gossip.portOffset'))

  dns.lookup(os.hostname(), function (err, gAddress) { // eslint-disable-line handle-callback-err
    var gHost = gAddress + ':' + gPort
    var registerNode = function () {
      ClusterSeed.update({
        _id: gHost
      }, {
        lastSeen: new Date()
      }, {
        upsert: true
      }, function (err) {
        if (err) {
          if (yaktor.peers) {
            logger.error('failed to update kill gossip')
            yaktor.gossipmonger.transport.close()
            delete yaktor.peers
          }
          logger.error(err.stack)
        }
        if (yaktor.peers) {
          var ps = yaktor.peers.livePeers()
          var sp = {}
          for (var p in ps) {
            sp[ ps[ p ].id ] = true
          }
          logger.silly('%s: gossiping to:', gPort, sp)
        } else {
          ClusterSeed.find({
            _id: {
              $ne: gHost
            }
          }, function (err, seeds) { // eslint-disable-line handle-callback-err
            async.map(seeds, function (clusterSeed, cb) {
              var h = clusterSeed.name.split(':')
              cb(null, {
                id: clusterSeed.name,
                transport: {
                  host: h[ 0 ],
                  port: h[ 1 ]
                }
              })
            }, function (err, gSeeds) { // eslint-disable-line handle-callback-err
              logger.info('Gossiping on %s with seeds:', gHost, gSeeds)
              var gossipmonger = new Gossipmonger({ // peerInfo
                id: gHost,
                transport: {
                  host: gAddress,
                  port: gPort
                }
              }, {
                seeds: gSeeds
              })
              yaktor.gossipmonger = gossipmonger
              yaktor.peers = gossipmonger.storage
              gossipmonger.on('error', function (error) { // eslint-disable-line handle-callback-err
                // XXX something :0
              })
              var deadPeerKillers = {}
              gossipmonger.on('peer dead', function (peer) {
                logger.warn('peer dead %s', peer.id)
                deadPeerKillers[ peer.id ] = setInterval(function () {
                  ClusterSeed.findOne({
                    _id: peer.id
                  }, function (err, seed) { // eslint-disable-line handle-callback-err
                    if (!seed) {
                      logger.warn('dead peer %s deleted', peer.id)
                      delete gossipmonger.storage.deadPeersMap[ peer.id ]
                      clearInterval(deadPeerKillers[ peer.id ])
                    }
                  })
                }, updateInterval)
              })
              gossipmonger.on('peer live', function (peer) {
                logger.warn('peer live %s', peer.id)
                clearInterval(deadPeerKillers[ peer.id ])
              })
              gossipmonger.on('peer new', function (peer) {
                logger.warn('peer live %s', peer.id)
              })
              gossipmonger.transport.listen(done)
              logger.silly('%s: gossiping to:', gPort, yaktor.peers.livePeers())
            })
          })
        }
      })
    }
    registerNode()
    setInterval(registerNode, updateInterval)
  })
}
