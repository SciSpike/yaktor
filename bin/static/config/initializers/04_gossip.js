var updateInterval = 60000
var os = require('os')
var dns = require('dns')
var path = require('path')
var async = require('async')
var logger = require(path.resolve('node_modules/conversation/lib/logger'))
var Gossipmonger = require('gossipmonger')
var ClusterSeed = require('mongoose').model('ClusterSeed')

logger.silly(__filename)

module.exports = function (done) {
  var app = this
  var conversation = app.conversation
  var gPort = (parseInt(app.get('port')) + 1000)

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
          if (conversation.peers) {
            logger.error('failed to update kill gossip')
            conversation.gossipmonger.transport.close()
            delete conversation.peers
          }
          logger.error(err.stack)
        }
        if (conversation.peers) {
          var ps = conversation.peers.livePeers()
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
              conversation.gossipmonger = gossipmonger
              conversation.peers = gossipmonger.storage
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
              logger.silly('%s: gossiping to:', gPort, conversation.peers.livePeers())
            })
          })
        }
      })
    }
    registerNode()
    setInterval(registerNode, updateInterval)
  })
}
