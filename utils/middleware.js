const morgan = require('morgan')
const logger = require('./logger')

const unknownEndpoint = (request, res, next) => {
  res.status(404).send({ error: 'unknown endpoint' })
  next()
}

const tokenExtractor = (req, res, next) => {
  const authorization = req.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    req.token = authorization.substring(7)
  }
  next()
}

const errorHandler = (error, req, res, next) => {
  logger.error(error.message)

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'invalid token' })
  }
  if (error.name === 'jwt malformed') {
    return res.status(401).json({ error: 'jwt malformed' })
  }

  next(error)
}

module.exports = {
  unknownEndpoint,
  tokenExtractor,
  errorHandler,
  logger,
  morgan,
}
