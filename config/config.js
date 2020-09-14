require('dotenv').config()

const { POSTGRES_KEY } = process.env

module.exports = {
  POSTGRES_KEY,
}
