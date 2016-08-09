var mqtt = require('mqtt')
var util = require('util')
var repl = require('repl')
var path = require('path')
var request = require('request')
require('winston/node_modules/colors')

var program = require('commander')
program.version('1.0.0')

var connect = function (url, auth, cb) {
  var client = mqtt.connect(url, {
    protocol: 'ws',
    qos: 1
  })
  client.on('error', function (err) {
    console.error(new Date().toISOString(), err)
    if (/Not authorized/.test(err.message)) {
      auth(function (err, b, auth) { // eslint-disable-line handle-callback-err
        client.options.username = auth.token_type
        client.options.password = auth.access_token
        client._reconnect()
      })
    }
  })
  var c = false
  client.once('connect', function () {
    if (c) return
    c = true
    cb && cb(null)
  })
  return client
}

program.command('connect')
  .description('allow raw access no auth') //
  .option('-u, --url <string>', 'where is the server', 'http://localhost:3000/mqtt')
  .action(function (opts) {
    var client = connect(opts.url, function (cb) {
      cb()
    }, function () { // eslint-disable-line handle-callback-err
      // A "local" node repl with a custom prompt
      var local = repl.start(util.format('mqtt > '))
      local.context.emit = function (topic, msg) {
        client.publish(topic, JSON.stringify(msg))
      }
      Object.defineProperty(local.context, 'client', {
        get: function () {
          return client
        }
      })
    })
    client.on('message', function (topic, payload) {
      console.log('message', topic, payload.toString())
    })
  })

/**
 * helper
 */
var managePrompt = function (local, opts, actions, m) {
  local.context.ACTIONS = actions
  local._prompt = getPrompt(opts, m[ 2 ])
  local.prompt()
}
var getPrompt = function (opts, s) {
  return util.format('%s:state:%s:%s $ ', opts.agentName.blue, (s || '').magenta, opts.agentId.yellowBG)
}
var createREPL = function (opts) {
  /**
   * Wire up REPL
   */
  return repl.start({
    prompt: getPrompt(opts),
    // ignoreUndefined:true,
    useGlobal: true,
    input: process.stdin,
    output: process.stdout
  })
}
program.command('agent')
  .description('get all the methods for an agent in scope') //
  .option('-u, --url <string>', 'where is the server', 'http://localhost:3000/mqtt')
  .option('-i, --agent-id <string>', 'agent id') //
  .option('-a, --agent-name <string>', 'agent name like conversation.agent') //
  .option('-n, --user-name <string>', 'your user name') //
  .option('-p, --password <string>', 'your password') //
  .action(
    function (opts) {
      var local = createREPL(opts)
      var aa = opts.agentName.split('.')
      var agent = require(path.join(process.cwd(), 'public', 'api', aa[ 0 ], aa[ 1 ]))

      /**
       * Connect and auth
       */
      var client = connect(opts.url, function (cb) {
        request.post('http://localhost:3000/auth/token', {
          body: {
            client_id: '0',
            grant_type: 'password',
            username: opts.userName,
            password: opts.password
          },
          json: true
        }, cb)
      })

      /**
       * API
       */
      var agentData = {
        _id: opts.agentId
      }

      var emit = function (action, msg) {
        client.publish(opts.agentName + '::' + action, JSON.stringify(msg), {
          qos: 1
        }, function (err, packet) {
          err && console.log('pbubub', err, packet)
        })
      }
      var action = function (action, data) {
        emit(action, {
          agentData: agentData,
          data: data
        })
      }
      local.context.init = function () {
        client.subscribe(opts.agentName + ':state:+:' + opts.agentId, { qos: 1 }, function (err, granted) {
          err && console.log('sbubb', err, granted)
        })
      }
      local.context.deinit = function () {
        client.unsubscribe(opts.agentName + ':state:+:' + opts.agentId, function (err, granted) {
          err && console.log('unsbubb', err, granted)
        })
        client.removeAllListeners('connect')
      }
      client.on('message', function (topic) {
        var m = /([^:]+:state:([^:]+)):(.*)/.exec(topic)
        if (m) {
          console.log('\n message', topic)
          managePrompt(local, opts, actions[m[1]], m)
        }
      })
      client.on('connect', function () {
        local.context.init()
      })

      /**
       * normalizer
       */
      var getActions = function () {
        var actions = {}
        Object.keys(agent.stateMatrix).forEach(function (fqnState) {
          actions[ fqnState ] = {}
          Object.keys(agent.stateMatrix[ fqnState ]).forEach(function (a) {
            actions[ fqnState ][ a ] = function (data) {
              action(a, data)
            }
          })
        })
        return actions
      }
      var actions = getActions(agent)
    })
program.parse(process.argv)
