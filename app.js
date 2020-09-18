const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')

const middleware = require('./utils/middleware')
const listRouter = require('./controllers/listRouter')
const usersRouter = require('./controllers/usersRouter')
const loginRouter = require('./controllers/loginRouter')

app.use(cors())
app.use(express.json())
app.use(middleware.morgan('dev'))
app.use(middleware.tokenExtractor)

app.use('/lists', listRouter)
app.use('/users', usersRouter)
app.use('/login', loginRouter)
app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
