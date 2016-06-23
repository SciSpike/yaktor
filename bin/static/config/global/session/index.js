module.exports = {
  enable: true,
  config: {
    resave: true,
    saveUninitialized: true,
    secret: 'a very unique secret that is hard to guess',
    key: 'connect.sid',
    cookie: {
      httpOnly: false,
      maxAge: 1000 * 20 * 60 * 60
    }
  }
}
