// Here is where you setupup your requires
var conversation = require('conversation')
var logger = conversation.logger

conversation.start(function (err, ports) {
  if (!err) {
    logger.info('Conversation Engine Started. Listening on port(s) ' + ports.join(','))
  }
})
