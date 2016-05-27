var path = require('path')
var AgentConversation = require(path.resolve('node_modules', 'mongoose')).model('AgentConversation')

var ConversationService = module.exports = {
  restoreAgentConversation: function (meta, agentQName, cb) {
    // var key = meta.agentDataId
    var ac = meta[ agentQName + ':' + meta.agentDataId + ':agentConversation' ]
    if (ac) {
      cb(null, ac, meta)
    } else {
      ConversationService.getAgentConversation(meta, agentQName, function (err, agentConversation) {
        if (agentConversation) {
          meta[ agentQName + ':' + agentConversation.agentDataId + ':agentConversation' ] = agentConversation
        }
        cb(err, agentConversation, meta)
      })
    }
  },
  getAgentConversation: function (meta, agentName, success) {
    var query = { agent: agentName }
    if (meta.conversationId != null) {
      query.conversationId = meta.conversationId
    } else {
      query.agentDataId = meta.agentDataId
      query.disposition = '1'
    }
    AgentConversation.findOne(query).exec(success)
  }

}
