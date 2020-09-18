const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const pool = require('../db')
const loginRouter = require('express').Router()

loginRouter.post('/', async (req, res) => {
  const { email, password } = req.body
  const login = await pool.query(
    `
    SELECT *
    FROM users
    WHERE users.email = $1
    `,
    [email]
  )

  const userLogin = login.rows[0]
  console.log('this is user login', userLogin)
  const passwordCorrect =
    userLogin === null
      ? false
      : await bcrypt.compare(password, userLogin.password)
  if (!(userLogin && passwordCorrect)) {
    return res.json({ error: 'invalid email or password' })
  }

  const userForToken = {
    user: userLogin.email,
    id: userLogin.id,
  }
  console.log(userForToken)

  const token = jwt.sign(userForToken, process.env.SECRET)
  res
    .status(200)
    .send({ token, user: userLogin.email, name: userLogin.first_name })
})

module.exports = loginRouter
