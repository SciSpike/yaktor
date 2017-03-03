module.exports = {
  hosts: [
    { host: 'localhost', port: 27017 },
    // TODO: add more entries here as needed; entries with a falsey host property are silently ignored
    { host: null, port: null },
    { host: null, port: null }
  ],
  db: 'yaktor',
  username: null,
  password: null,
  options: { // see https://docs.mongodb.com/manual/reference/connection-string/#connections-connection-options
    replicaSet: null,
    ssl: null,
    connectTimeoutMS: null,
    socketTimeoutMS: null,
    maxPoolSize: null,
    minPoolSize: null,
    maxIdleTimeMS: null,
    waitQueueMultiple: null,
    waitQueueTimeoutMS: null,
    w: null,
    wtimeoutMS: null,
    journal: null,
    readConcernLevel: null,
    readPreference: null,
    maxStalenessSeconds: null,
    readPreferenceTags: null,
    authSource: null,
    authMechanism: null,
    gssapiServiceName: null,
    localThresholdMS: null,
    serverSelectionTimeoutMS: null,
    serverSelectionTryOnce: null,
    heartbeatFrequencyMS: null,
    uuidRepresentation: null
  }
}
