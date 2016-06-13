// default yaktor configuration values

module.exports = {
  log: {
    filename: '',
    level: 'info',
    stdout: true
  },
  enginePath: './engine',
  conversations: {
    basedir: 'conversations',
    types: 'types',
    modules: 'js'
  },
  generator: {
    basedir: 'src-gen',
    models: 'modelAll'
  },
  mongo: {
    host: 'localhost',
    port: 27017,
    db: 'yaktor',
    options: {
      server: {
        auto_reconnect: true,
        numberOfRetries: 1000000
      }
    }
  },
  amqp: {
    force: false,
    options: {
      connection: {
        host: 'localhost',
        port: 5672,
        heartbeat: 55
      }
    }
  }
}
