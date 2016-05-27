/**
 * Missing or awkward:
 * - What if I wanted to make a link from a type.
 *   Perhaps we need a entity reference field?
 * - We had an index for the 'loc' attribute (2d)
 * - Hit many oracle keywords...
 * - UserPaymentLocation type was a map. Could I do this?
 */
/**
 * The conversation model contains domain objects that are essential for the operation of the confersation engine's backbone.
 * As a software developer you would typically not have to deal with this model.
 * 
 */
domain-model Conversation {
  node-mongo-options {
    extensions {
      ClusterSeed {
        ttl lastSeen 61
      }
      Session {
        ttl expires 0
      }
    }
  }
  enum Disposition {
    INACTIVE = "0" ACTIVE = "1"
  }
  /**
   * The +AgentConversation+ defines the data structure used
   * to track the state of the agents in the context of a
   * specific conversation.
   */
  entity AgentConversation {
    /*
     * Identifies the conversation.
     */
    String conversationId
    /*
     * Defines the name of the agent.
     */
    String agent
    /*
     * Defines the state of the agent.
     */
    String state
    String agentDataId
    enum Disposition disposition
    Any data?
    unique-constraint agent agentDataId disposition unique-constraint agent
    conversationId
  }
  entity ClusterSeed {
    String name unique
    Date lastSeen
    key (name)
  }
  entity Session {
    String sid
    Any data
    Date expires
    key(sid)
  }
}