// default cassandra configuration values

module.exports = {
  cassandra: {
    enable: false,
    hosts: 'localhost', // comma-delimited hostname string
    keyspace: 'yaktor',
    port: 9042 // all hosts must use the same port
  }
}
