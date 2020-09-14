const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const pool = require('../db')

// Creats new user
usersRouter.post('/', async (req, res) => {
  const { body } = req
  const saltRounds = 10
  if (body.password.length < 4 || body.email.length < 4) {
    //TODO: check for duplicate emails for user uniqueness
    return res.status(400).json({
      error: 'user name and password must be longer than 3 characters',
    })
  }
  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const newUser = await pool.query(
    'INSERT INTO users(first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
    [body.firstName, body.lastName, body.email, passwordHash]
  )
  res.status(200).json(newUser.rows[0])
})

// Gets all users
usersRouter.get('/', async (req, res) => {
  const allUsers = await pool.query(`
  SELECT users.id, users.first_name, users.email, json_agg(movie_lists) as movelists FROM
  users
  INNER JOIN movie_lists ON users.id = movie_lists.user_id
  GROUP BY 1,2,3
    `)
  res.json(allUsers.rows)
})

module.exports = usersRouter
