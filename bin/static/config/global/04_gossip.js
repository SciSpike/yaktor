var logger = require('yaktor/logger')
logger.info(__filename)
var os = require('os')
var dns = require('dns')
var async = require('async')
var Gossipmonger = require('gossipmonger')
var ClusterSeed = require('mongoose').model('ClusterSeed')

module.exports = function (yaktor, done) {
  var gPort = yaktor.gossip.port
  var i = parseInt(gPort)
  if (gPort.toString() !== i.toString()) return done(new Error('gossip port is not an integer'))
  gPort = i

  var updateInterval = yaktor.gossip.updateIntervalMillis
  i = parseInt(updateInterval)
  if (updateInterval.toString() !== i.toString()) return done(new Error('gossip updateIntervalMillis is not an integer'))
  updateInterval = i

  dns.lookup(os.hostname(), function (err, gAddress) {
    if (err) return done(err)

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
          if (yaktor.gossip.peers) {
            logger.error('failed to update kill gossip')
            yaktor.gossip.monger.transport.close()
            delete yaktor.gossip.peers
          }
          logger.error(err.stack)
        }
        if (yaktor.gossip.peers) {
          var ps = yaktor.gossip.peers.livePeers()
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
              yaktor.gossip.monger = gossipmonger
              yaktor.gossip.peers = gossipmonger.storage
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
              gossipmonger.transport.listen(function (err) {
                if (!err) {
                  gossipmonger.gossip()
                  logger.silly('%s: gossipping to:', gPort, yaktor.gossip.peers.livePeers())
                }
                done(err)
              })
            })
          })
        }
      })
    }
    registerNode()
    setInterval(registerNode, updateInterval)
  })
}
