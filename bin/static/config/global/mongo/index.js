module.exports = {
  host: 'localhost',
  port: 27017,
  db: 'yaktor',
  options: {
    server: {
      auto_reconnect: true,
      numberOfRetries: 1000000
    }
  }
}
