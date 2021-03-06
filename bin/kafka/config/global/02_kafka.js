var logger = require('yaktor/logger')
logger.info(__filename)
var kafka = require('kafka-node')
var async = require('async')
var auditLogger = require('yaktor/lib/auditLogger')

var logError = function (error) {
  if (error) {
    logger.error('%s \ncaused by: %s', new Error('transition failure').stack, error.stack)
  }
}
var getUserName = function (user) {
  user = user || {}
  return user._id || user.email || 'anonymous'
}

module.exports = function (yaktor, cb) {
  if (!yaktor.kafka.enable) return cb()

  var client
  var producer

  async.series([
    function createProducer (next) {
      var opts = yaktor.kafka.client
      client = new kafka.Client(opts.connectionString, opts.clientId, opts.zkOptions, opts.noAckBatchOptions, opts.sslOptions)
      producer = new kafka.Producer(client, yaktor.kafka.producer)
      producer.once('ready', next)
      producer.once('error', next)
    },
    function resetErrorListeners (next) {
      producer.removeAllListeners('error')
      producer.on('error', logError)
      next()
    },
    function createTopic (next) {
      if (!yaktor.kafka.createTopic) return next()
      producer.createTopics([ yaktor.kafka.topic ], true, next)
    }
  ], cb)

  var createPayload = function (msg) {
    return {
      topic: yaktor.kafka.topic,
      messages: [ JSON.stringify(msg) ],
      attributes: yaktor.kafka.attributes
    }
  }

  auditLogger.transition = function (originalAgentDataId, meta, agentName, agentConversation, transition, data) {
    var userName = getUserName(meta.user)
    var msg = {
      type: 'transition',
      conversationId: originalAgentDataId || 'null',
      toConversationId: meta.agentDataId || 'null',
      time: new Date(),
      userName: userName,
      agentName: agentName,
      agentStateName: agentConversation.state,
      eventName: transition.causeName,
      data: data
    }
    producer.send([ createPayload(msg) ],
      function (err) {
        if (err) {
          logger.error('transition', err.stack, meta.user)
        }
      })
  }
  auditLogger.event = function (meta, time, json, agentName, eventName, state, subEventName) {
    var conversationId = meta.agentDataId
    var userName = getUserName(meta.user)

    var msg = {
      type: 'event',
      conversationId: conversationId || 'null',
      time: time,
      userName: userName,
      data: typeof json === 'string' ? JSON.parse(json) : json,
      agentName: agentName,
      eventName: eventName,
      agentStateName: state,
      subEventName: subEventName || ''
    }
    producer.send([ createPayload(msg) ],
      function (err) {
        if (err) {
          logger.error('event', err.stack, JSON.stringify(meta))
        }
      })
  }
  auditLogger.web = function (path, user, time, method, query, body, headers, responseCode) {
    var userName = getUserName(user)
    var msg = {
      type: 'web',
      path: path,
      userName: userName,
      time: time,
      method: method,
      query: query,
      body: body,
      headers: headers,
      responseCode: responseCode
    }
    producer.send([ createPayload(msg) ],
      function (err) {
        if (err) {
          logError(err)
        }
      })
  }
  auditLogger.db = function (collection, time, operation, query, doc, cb) {
    var msg = {
      type: 'db',
      collection: collection,
      time: time,
      operation: operation,
      query: query || '',
      doc: doc || ''
    }
    producer.send([ createPayload(msg) ],
      function (err) {
        cb(err)
      })
  }
}
