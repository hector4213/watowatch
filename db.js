const Pool = require('pg').Pool
const config = require('./utils/config')

const pool = new Pool({
  user: config.PG_USER,
  password: config.POSTGRES_KEY, ///config to config
  host: config.PG_HOST,
  port: config.PG_PORT,
  database: config.DB,
})

module.exports = pool
