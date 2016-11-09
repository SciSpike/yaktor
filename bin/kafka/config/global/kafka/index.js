// default kafka configuration values

module.exports = {
  enable: false,
  topic: 'yaktor-auditlog',
  partition: 0,
  attributes: 0,
  createTopic: true,
  // see https://www.npmjs.com/package/kafka-node#clientconnectionstring-clientid-zkoptions-noackbatchoptions-ssloptions
  client: {
    clientId: 'yaktor-auditlog',
    connectionString: 'zookeeper:2181/',
    // see https://github.com/alexguan/node-zookeeper-client#client-createclientconnectionstring-options
    zkOptions: null,
    noAckBatchOptions: null,
    sslOptions: null
  },
  // see https://www.npmjs.com/package/kafka-node#producerclient-options
  producer: null
}
