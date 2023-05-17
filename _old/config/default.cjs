const secret = require('./secret.cjs');

module.exports = {
  basic: {
    user: secret.basic.user,
    pass: secret.basic.pass,
  },
  app_id: "stream",
  mongo_path: secret.mongo_path
}
