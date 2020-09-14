const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const listRouter = require('./controllers/listRouter')
const usersRouter = require('./controllers/usersRouter')
const loginRouter = require('./controllers/loginRouter')

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))
app.use('/lists', listRouter)
app.use('/users', usersRouter)
app.use('/login', loginRouter)

const PORT = 3001

app.listen(PORT, () => {
  console.log(`Server Online Running on PORT: ${PORT}`)
})
