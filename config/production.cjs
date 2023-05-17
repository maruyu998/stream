const secret = require('./secret.cjs')
require('dotenv').config()

module.exports = {
  server: {
    port: process.env.PRODUCTION_PORT
  },
  app_secret: secret.app_secret,
  authserver: secret.authServer,
  SESSION_SECRET: secret.SESSION_SECRET,
  mongo_session_path: secret.mongo_session_path,
  mongo_session_collection: secret.mongo_session_collection
}
