var logger = require(path.resolve('yaktor/lib/logger'))
logger.silly(__filename)
var cql = require('cassandra-driver')
var async = require('async')
var path = require('path')
var auditLogger = require(path.resolve('node_modules/yaktor/lib/auditLogger'))

var logError = function (error) {
  if (error) {
    logger.error('%s \ncaused by: %s', new Error('transition failure').stack, error.stack)
  }
}
var getUserName = function (user) {
  user = user || {}
  return user._id || user.email || 'anonymous'
}

module.exports = function (cb) {
  var app = this
  var cfg = app.get('serverConfig')

  if (!cfg.cassandra.enable) {
    cql.client = {
      execute: function (query, data, options, cb) {
        (cb || options || data)()
      }
    }
    cb()
  }
  else {
    var hosts = cfg.cassandra.hosts.split(',')
    var keyspace = cfg.cassandra.keyspace
    var hostPort = parseInt(cfg.cassandra.port)
    // this will break if you have differing ports across servers :)
    hosts = hosts.map(function (host) {
      return host.replace(/([^:]*)(:(\d+))?/, function (all, host, colon, port) {
        if (port) hostPort = port
        return host
      })
    })

    async.series([
      function createClient (next) {
        cql.client = new cql.Client({
          contactPoints: hosts,
          protocolOptions: {
            port: hostPort
          }
        })
        next(null)
      },
      function connect (next) {
        cql.client.connect(next)
      },
      function createKeyspace (next) {
        var query = 'CREATE KEYSPACE IF NOT EXISTS ' + keyspace + " WITH replication = {'class': 'SimpleStrategy', 'replication_factor':'" + Math.min(3, hosts.length) + "' }"
        cql.client.execute(query, next)
      },
      function useKeyspace (next) {
        cql.client.keyspace = keyspace
        var query = 'USE ' + keyspace
        cql.client.execute(query, next)
      },
      function createTables (next) {
        var execute = function (string, cb) {
          cql.client.execute(string, cb)
        }
        async.parallel([
          async.apply(execute, 'CREATE TABLE IF NOT EXISTS webEvent(path text,userName text,time timestamp,method text, query text,body text,headers text,responseCode int, PRIMARY KEY (path, username, time, method))'),
          async.apply(execute, 'CREATE TABLE IF NOT EXISTS dbEvent(collection text,time timestamp, operation text, query text, doc text, PRIMARY KEY (collection, time, operation))'),
          async.apply(execute, 'CREATE TABLE IF NOT EXISTS conversationEvent(conversationId text,time timestamp,userName text, eventId uuid,json text,agentName text,eventName text, subEventName text, agentStateName text, PRIMARY KEY (conversationId, time,subEventName,username))'),
          async.apply(execute, 'CREATE TABLE IF NOT EXISTS conversationTransitionCausedBy(conversationId text,toConversationId text,time timestamp,userName text, toEventId uuid,eventId uuid,json text,agentName text,eventName text, agentStateName text, PRIMARY KEY (conversationId, time,toConversationId,username))')
        ], next)
      }
    ], cb)

    auditLogger.transition = function (originalAgentDataId, meta, agentName, agentConversation, transition, data) {
      var userName = getUserName(meta.user)
      cql.client.execute('insert into conversationTransitionCausedBy(conversationId,toConversationId,time,userName,agentName,agentStateName,eventName,json) VALUES (?,?,?,?,?,?,?,?)',
        [
          originalAgentDataId || 'null',
          meta.agentDataId || 'null',
          new Date().getTime(),
          userName,
          agentName,
          agentConversation.state,
          transition.causeName,
          JSON.stringify(data)
        ],
        {
          prepare: true
        },
        function (err) {
          if (err) {
            logger.error('transition', err.stack, meta.user)
          }
        })
    }
    auditLogger.event = function (meta, time, json, agentName, eventName, state, subEventName) {
      var conversationId = meta.agentDataId
      var userName = getUserName(meta.user)
      cql.client.execute('insert into conversationEvent (conversationId,time,userName,json,agentName,eventName,agentStateName,subEventName) VALUES (?,?,?,?,?,?,?,?)',
        [ conversationId || 'null', time, userName, json, agentName, eventName, state, subEventName || '' ], {
          prepare: true
        },
        function (err) {
          if (err) {
            logger.error('event', err.stack, JSON.stringify(meta))
          }
        })
    }
    auditLogger.web = function (path, user, time, method, query, body, headers, responseCode) {
      var userName = getUserName(user)
      cql.client
        .execute(
          'insert into webEvent (path, userName, time, method, query, body, headers, responseCode) VALUES (?,?,?,?,?,?,?,?)',
          [ path, userName, time, method, query, body, headers, responseCode ], { prepare: true }, function (err) {
            if (err) {
              logError(err)
            }
          })
    }
    auditLogger.db = function (collection, time, operation, query, doc, cb) {
      cql.client
        .execute(
          'insert into dbEvent (collection,time, operation,query, doc) VALUES (?,?,?,?,?)',
          [ collection, time, operation, query || '', doc || '' ], { prepare: true }, function (err) {
            cb(err)
          })
    }
  }
}
