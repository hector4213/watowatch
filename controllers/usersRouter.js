const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const pool = require('../db')

// Creats new user
usersRouter.post('/', async (req, res) => {
  const { firstName, lastName, email, password } = req.body
  const saltRounds = 10
  // TODO check if there is a duplicate user
  const isDuplicate = await pool.query(
    `
    SELECT *
    FROM users
    WHERE users.email = $1
  `,
    [email]
  )

  if (isDuplicate.rows.length < 1) {
    if (password.length < 4 || email.length < 4) {
      //TODO: checks for duplicate emails for user uniqueness
      return res.status(400).json({
        error: 'user name and password must be longer than 3 characters',
      })
    }
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const newUser = await pool.query(
      'INSERT INTO users(first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [firstName, lastName, email, passwordHash]
    )
    res.status(200).send({ msg: 'User Created!' })
  }
  res.status(409).json({ error: 'User already exists' })
})

// Gets all users
usersRouter.get('/', async (req, res) => {
  const allUsers = await pool.query(`
  SELECT users.id, users.first_name, users.email, json_agg(movie_lists) as movelists FROM
  users
  LEFT JOIN movie_lists ON users.id = movie_lists.user_id
  GROUP BY 1
    `)
  res.json(allUsers.rows)
})

//Get a single user

usersRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  const selectedUser = await pool.query(
    `
    SELECT  users.id, users.first_name, users.email, json_agg(movie_lists) as movielists FROM
    users
    LEFT JOIN movie_lists ON users.id = movie_lists.user_id
    WHERE users.id = $1
    GROUP BY 1
    `,
    [id]
  )
  res.status(200).json(selectedUser.rows[0])
})

usersRouter.get('/lists/:id', async (req, res) => {
  const { id } = req.params
  const userCollection = await pool.query(
    `
  SELECT movie_lists.title, movie_lists.id as list_id, movie_lists.user_id, COALESCE(json_agg(DISTINCT movies.tvdb_movieid)filter(where movies.tvdb_movieid IS NOT NULL),'[]') as movies FROM movie_lists
  LEFT JOIN movie_list_items ON movie_lists.id = movie_list_items.movie_lists_id
  FULL OUTER JOIN movies ON movies.id = movie_list_items.movies_id
  WHERE movie_lists.user_id = $1
  GROUP BY 2 `,
    [id]
  )
  res.status(200).json(userCollection.rows)
})
module.exports = usersRouter
