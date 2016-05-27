var path = require('path')
var logger = require(path.join('..', 'lib', 'logger'))
module.exports = {
  transition: function (originalAgentDataId, meta, agentName, agentConversation, transition, data) {
    logger.silly('auditLogger', 'transition',
      originalAgentDataId || 'null',
      meta.agentDataId || 'null',
      new Date().getTime(),
      meta.user,
      agentName,
      agentConversation.state,
      transition.causeName,
      JSON.stringify(data)
    )
  },
  event: function (meta, time, json, agentName, eventName, state, subEventName) {
    var conversationId = meta.agentDataId
    var user = meta.user
    logger.silly('auditLogger', 'event', conversationId || 'null', time, user, json, agentName, eventName, state, subEventName || '')
  },
  web: function (path, user, time, method, query, body, headers, responseCode) {
    logger.silly('auditLogger', 'web', path, user, time, method, query, body, headers, responseCode)
  },
  db: function (collection, time, operation, query, doc, cb) {
    logger.silly('auditLogger', 'db', collection, time, operation, query || '', doc || '')
    if (cb) cb()
  }
}
