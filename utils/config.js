require('dotenv').config()

const { POSTGRES_KEY, PORT, PG_USER, PG_PORT, DB, PG_HOST } = process.env

module.exports = {
  POSTGRES_KEY,
  PORT,
  PG_USER,
  PG_PORT,
  DB,
  PG_HOST,
}
