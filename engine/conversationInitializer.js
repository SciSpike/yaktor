var agents = {}
var async = require('async')
var path = require('path')
var messageService = require(path.join('..', 'services', 'messageService'))
var localEmitter = require(path.join('..', 'services', 'localEmitter'))
var socketService = require(path.join('..', 'services', 'socketService'))
var logger = require(path.join('..', 'logger'))
var conversationService = require('./conversationService')
var util = require('util')
require('winston/node_modules/colors')
var agentConversationModel = require('mongoose').model('AgentConversation')
var getAgentConversation = conversationService.restoreAgentConversation
var yaktor = require('../index')

var auditLogger = require(path.join('..', 'lib', 'auditLogger'))

var noAuth = function (user, agentName, cb) {
  cb(null, true)
}
var noMessageAuth = function (user, event, meta, reqData, cb) {
  cb(null, true)
}
var checkAuth = function (authorized, cb) {
  cb(authorized ? null : new Error('not authorized'))
}
var socketEventHandler = function (agent, reqData, event, qId, conversation, user, callback) {
  reqData = reqData || {}
  var meta = {}
  meta.qId = qId
  meta.user = user
  meta.agentDataId = reqData._id
  meta.agentData = reqData
  var agentAuthorize = yaktor.auth && yaktor.auth.agentAuthorize || noAuth
  var messageAuth = agent.messageAuth || noMessageAuth
  logger.silly('%s on event: %s; %s; agentDataId: %s', agent.name.blue, event.yellow, qId, meta.agentDataId.yellowBG)
  async.waterfall([
    async.apply(agentAuthorize, user, agent.name),
    checkAuth,
    async.apply(messageAuth, user, event, meta, reqData),
    checkAuth
  ], function (err) {
    callback(err, meta, agent.name)
  })
}

var logError = function (error) {
  if (error) {
    logger.error('%s \ncaused by: %s', new Error('transition failure').stack, error.stack)
  }
}

var fireEvent = function (meta, data, event, agentName, state) {
  auditLogger.event(meta, new Date().getTime(), JSON.stringify(data), agentName, event, state)
  localEmitter.emit(event, meta, data)
}

var doTransitionActivationHandler = function (transition, agentConversation, meta, data, done) {
  logger.silly('%s in %s; handler(%s) on: %s', agentConversation.agent.blue, meta.agentDataId.yellowBG, (transition.handler) ? 'true'.green : 'false'.red, transition.causeName.yellow)
  if (transition.handler) {
    transition.handler(transition.causeName, meta, data, done)
  } else {
    done(null, data)
  }
}

var emitSocketState = function (agentName, state, toState, meta, data) {
  state = state || {}
  logger.silly('%s in %s; broadcasting(%s) to %s;', agentName.blue, meta.agentDataId.yellowBG, (state.name !== toState.name) ? 'true'.green : 'false'.red, toState.name.magenta)
  if (state.name !== toState.name) {
    messageService.emit(agentName + ':state:' + toState.name + ':' + meta.agentDataId, data)
  }
}

var doPostTransitionTrigger = function (transition, meta, data, agentName, state, done) {
  if (transition.triggers) {
    if (transition.triggers.type === 'InternalPublish') {
      // XXX: no one is Listening")
      logger.silly('emitting ' + agentName.blue + '::' + transition.triggers.name + ':' + meta.agentDataId, data)
      messageService.emit(agentName + '::' + transition.triggers.name + ':' + meta.agentDataId, data)
    }
    logger.silly('%s in %s; sends %s', agentName.blue, meta.agentDataId.yellowBG, transition.triggerName.yellow)
    fireEvent(meta, data, transition.triggers, agentName, state)
    done(null, data)
  } else {
    done(null, data)
  }
}
var doToState = function (agentName, fromState, toState, meta, data, cb) {
  if (toState.on) {
    logger.silly('%s in %s; handler for %s;', agentName.blue, meta.agentDataId.yellowBG, toState.name.magenta)
    // notice the extra argument
    toState.on(meta, data, cb)
  } else {
    cb(null, data)
  }
}
var doDecision = function (agentName, state, meta, data, decision, cb) {
  var ts = state.transitions
  if (ts && ts[ decision ]) {
    logger.silly('%s in %s; while %s %s to %s;', agentName.blue, meta.agentDataId.yellowBG, state.name.magenta, 'decided'.cyan, decision.yellow)
    fireEvent(meta, data, ts[ decision ].on, agentName, state.name)
  }
  cb(null, data)
}
var doState = function (agentName, state, transition, agentConversation, meta, oldData, data, done) {
  var oldState = agentConversation.state
  var newState = transition.to.name
  done = done || data
  if (done === data) {
    data = oldData
  }
  agentConversation.state = newState
  var action = function (doc, cb) {
    var id = doc._id
    var docToSave = {}
    if (doc.toObject) {
      docToSave = doc.toObject()
    } else {
      util._extend(docToSave, doc)
    }
    delete docToSave._id
    agentConversationModel.findOneAndUpdate({
      _id: id
    }, docToSave, cb)
  }
  //  if (Object.keys(transition.to.transitions).length<1) {
  //    logger.silly("ending agent %s", agentName)
  //    action = function(doc, cb) {
  //      agentConversationModel.remove({_id:doc._id}, cb)
  //    }
  //    agentConversation.disposition = "0"
  //  }
  action(agentConversation, function (err, agentConversation) {
    logger.silly('%s in %s; was %s %s %s;', agentName.blue, meta.agentDataId.yellowBG, oldState.magenta, 'becomes'.cyan, transition.to.name.magenta)
    if (err) {
      done(err, data)
    } else {
      doToState(agentName, oldState, transition.to, meta, data, function (err, toData, decision) {
        emitSocketState(agentName, oldState, transition.to, meta, toData)
        if (!err && decision) {
          doPostTransitionTrigger(transition, meta, toData, agentName, oldState, function () { // eslint-disable-line handle-callback-err
            doDecision(agentName, transition.to, meta, toData, decision, done)
          })
        } else if (!err) {
          // XXX should be toData !!
          doPostTransitionTrigger(transition, meta, data, agentName, oldState, done)
        } else {
          done(err, data)
        }
      })
    }
  })
}

var emitInit = function (meta, agentName, agentConversation, socket, data) {
  logger.silly('emitting %s:state:%s:%s', agentName.blue, agentConversation.state.magenta, meta.agentDataId.yellowBG)
  logger.silly('emitting %s::agent-init', agentName.blue)
  socket.emit(agentName + '::agent-init', null)
  socket.emit(agentName + ':state:' + agentConversation.state + ':' + meta.agentDataId, data)
}

var initAgent = function (agent, meta, socket, data, cb) {
  agent.init(meta, function (agentConversations) {
    var agentName = agent.name
    var agentConversation = agentConversations[ agentName ]
    emitInit(meta, agentName, agentConversation, socket, data)
    cb(null, agentConversation)
  })
}
var comparator = function (a, b) { // eslint-disable-line no-unused-vars
  if (a === 'null') {
    return 1
  } else if (b === 'null') {
    return -1
  } else {
    return a.localeCompare(b)
  }
}
module.exports = function (conversation, done) {
  var conversationName = conversation.name
  logger.silly('loading conversation %s', conversationName)
  if (!conversation.agents) {
    return done()
  }
  async.series([ function (next) {
    async.each(Object.keys(conversation.agents), function (agentName, configDone) {
      var agent = conversation.agents[ agentName ]
      // short circuit if not our conversation
      if (agents[ agentName ] || agent.conversationName !== conversationName) {
        return configDone()
      }

      var states = agent.states
      var transitionEvents = agent.transitionEvents
      // Listen to transition events
      agents[ agentName ] = true
      async.each(Object.keys(transitionEvents), function (eventName, transConfigDone) {
        var event = transitionEvents[ eventName ]
        // var prioritizedStates = event.states.slice(0).sort(comparator)
        localEmitter.on(event.label, function (oldMeta, data) {
          var keysMapped = {}
          var originalAgentDataId = oldMeta.agentDataId
          var doFullTrans = function (meta, agentConversation, ftcb) {
            var state = states[ agentConversation.state ]
            var transition = state.transitions[ eventName ]
            logger.debug('%s in %s state %s doing %s ', agentName.blue, meta.agentDataId.yellowBG, agentConversation.state.magenta, transition.description.cyan)
            auditLogger.transition(originalAgentDataId, meta, agentName, agentConversation, transition, data)
            async.waterfall([
              async.apply(doTransitionActivationHandler, transition, agentConversation, meta, data),
              async.apply(doState, agentName, state, transition, agentConversation, meta, data)
            ], ftcb)
          }

          async.waterfall([
            function findKeys (cb) {
              async.each(event.states, function (stateName, ccb) {
                var state = states[ stateName ]
                var transition = state.transitions[ eventName ]
                var agentDataId = transition.mapping ? transition.mapping(oldMeta, data) : originalAgentDataId
                var agentDataIds = [].concat(agentDataId)
                agentDataIds.forEach(function (id) {
                  if (id) {
                    var a = keysMapped[ id ]
                    if (a) {
                      a.push(stateName)
                    } else {
                      keysMapped[ id ] = [ stateName ]
                    }
                  }
                })
                ccb()
              }, cb)
            },
            function lookupAgent (cb) {
              logger.silly('%s from %s; mapping to { %s }', agentName.blue, originalAgentDataId.yellowBG, JSON.stringify(keysMapped))
              var sharedMeta = oldMeta
              // var originalConversationId = oldMeta.conversationId
              async.each(Object.keys(keysMapped), function (agentDataId, dcb) {
                var meta = {}
                // clone it
                util._extend(meta, sharedMeta)
                meta.agentDataId = agentDataId
                async.waterfall([
                  async.apply(getAgentConversation, meta, agentName),
                  function (agentConversation, meta, dcb) {
                    if (agentConversation) {
                      if (keysMapped[ agentDataId ].indexOf(agentConversation.state) > -1) {
                        doFullTrans(meta, agentConversation, dcb)
                      } else {
                        return dcb()
                      }
                    } else if (
                      keysMapped[ agentDataId ].indexOf(agent.initialState) > -1 ||
                      keysMapped[ agentDataId ].indexOf('null') > -1) {
                      // we have permission to init()
                      initAgent(agent, meta, messageService, data, function (err, agentConversation) { // eslint-disable-line handle-callback-err
                        // now that we have a conversation do the transition.
                        doFullTrans(meta, agentConversation, dcb)
                      })
                    } else {
                      logger.silly('not emitting, %s:%s already emitted/not inited.', agentName, meta.agentDataId.yellowBG)
                      return dcb()
                    }
                  }
                ], dcb)
              }, cb)
            }
          ], logError)
        })
        transConfigDone()
      }, configDone)
    }, next)
  }, function (next) {
    async.each(Object.keys(conversation.agents), function (agentName, connectionNext) {
      // register with socketService so that we listen when they connect.
      socketService.agents[ agentName ] = function (socket, conn, sessionId, session, user, doneConnecting) {
        // ////////
        var agent = conversation.agents[ agentName ]
        var states = agent.states
        if (agent.isConnectable) {
          logger.silly('connection in %s', agentName.blue)
          var initName = agentName + '::init'
          var deinitName = agentName + '::deinit'
          var agentListeners = {}
          var listen = function (agentDataId, e, fn) {
            agentListeners[ agentDataId ].push([ e, fn ])
            messageService.on(e, fn)
          }
          var unListen = function (agentDataId) {
            logger.silly('agent: %s; %s listeners %s', agentName.blue, 'ending'.red, agentDataId.yellowBG)

            var listeners = agentListeners[ agentDataId ]
            delete agentListeners[ agentDataId ]

            if (listeners) {
              var ln
              while (listeners.length) {
                ln = listeners.pop()
                messageService.removeListener(ln[ 0 ], ln[ 1 ])
              }
            }
          }
          var disconnect = function () {
            socket.removeAllListeners(initName)
            async.each(agent.internalEvents, function (event, cb) {
              socket.removeAllListeners(event)
            })
          }
          var socketEventComplete = function (err) {
            if (err) {
              logger.silly('agent: %s::error %s', agentName.blue, err.stack || err.toString())
              socket.emit(agentName + '::error', {
                message: err.message,
                name: err.name
              })
            }
          }
          conn.on('close', function () {
            for (var a in agentListeners) {
              unListen(a)
            }
            disconnect()
          })
          var registerClientListeners = function (agentDataId, cb) {
            var isListening = true
            if (agentListeners[ agentDataId ] == null) {
              agentListeners[ agentDataId ] = []
              isListening = false
            }
            if (!isListening) {
              logger.silly('agent: %s; initing', agentName.blue, !isListening ? 'true'.green : 'false'.blue)
              async.each(Object.keys(agent.states), function (stateName, cb) {
                var state = agent.states[ stateName ]
                var ts = Object.keys(state.transitions).length
                listen(agentDataId, agentName + ':state:' + stateName + ':' + agentDataId, function (data) {
                  logger.silly('emitting ' + agentName.blue + ':state:' + stateName.magenta + ':' + agentDataId.yellowBG)
                  socket.emit(agentName + ':state:' + stateName + ':' + agentDataId, data)
                  if (ts < 1) {
                    unListen(agentDataId)
                  }
                })
                cb()
              }, cb)
            } else {
              cb()
            }
          }
          socket.on(deinitName, function (data) {
            var agentDataId = data._id
            logger.silly('%s deinit in %s', agentName.blue, agentDataId.yellowBG)
            unListen(agentDataId)
          })
          socket.on(initName, function (data) {
            var agentDataId = data._id
            logger.silly('%s init in %s', agentName.blue, agentDataId.yellowBG)
            // remove listeners and make ready in case you need to listen again.
            async.waterfall([
              async.apply(socketEventHandler, agent, data, initName, sessionId, conversation, user),
              function (meta, agentName, cb) {
                registerClientListeners(agentDataId, function () { // eslint-disable-line handle-callback-err
                  cb(null, meta, agentName)
                })
              },
              async.apply(getAgentConversation),
              function (agentConversation, meta) {
                // replay current state event
                if (!agentConversation) {
                  // You are the instigator we will init the conversation
                  logger.silly('no state about to create; %s: %s', agentName.blue, sessionId)
                  async.waterfall([
                    async.apply(initAgent, agent, meta, socket, null),
                    function (agentConversation, cb) {
                      var state = states[ agentConversation.state ]
                      doToState(agentName, null, state, meta, meta, function (err, toData, decision) {
                        cb(err, toData, decision, state)
                      })
                    },
                    function (toData, decision, state, cb) {
                      if (decision) {
                        doDecision(agentName, state, meta, toData, decision, cb)
                      }
                    }
                  ], logError)
                } else {
                  emitInit(meta, agentName, agentConversation, socket, null)
                }
              }
            ], socketEventComplete)
          })
          async.each(agent.internalEvents, function (event, cb) {
            logger.silly('%s for %s', 'listening'.red, event.yellow)
            socket.on(event, function (socketDataWrapper) {
              var socketData = socketDataWrapper.data
              var data = socketDataWrapper.agentData
              var agentDataId = data._id
              async.waterfall([
                async.apply(registerClientListeners, agentDataId),
                async.apply(socketEventHandler, agent, data, event + ':' + agentDataId, sessionId, conversation, user),
                async.apply(getAgentConversation),
                function (agentConversation, meta) {
                  fireEvent(meta, socketData, event, agentName, agentConversation ? agentConversation.state : 'null')
                }
              ], socketEventComplete)
            })
            cb()
          }, doneConnecting)
        } else {
          doneConnecting()
        }
      }
      connectionNext()
    }, next)
  } ], done)
}
