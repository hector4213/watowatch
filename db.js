const Pool = require('pg').Pool
const config = require('./config/config')

const pool = new Pool({
  user: 'hector',
  password: config.POSTGRES_KEY, ///config to config
  host: 'localhost',
  port: 5432,
  database: 'test',
})

module.exports = pool
