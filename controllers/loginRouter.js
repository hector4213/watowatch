const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const pool = require('../db')
const loginRouter = require('express').Router()

loginRouter.post('/', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(401).send({ msg: 'Please enter a username and password' })
  }
  const login = await pool.query(
    `
    SELECT *
    FROM users
    WHERE users.email = $1
    `,
    [email]
  )

  if (login.rows.length < 1) {
    res.status(401).send({ msg: 'Email does not exist' })
  }

  const userLogin = login.rows[0]
  const passwordCorrect =
    userLogin === null
      ? false
      : await bcrypt.compare(password, userLogin.password)
  if (!passwordCorrect) {
    return res.status(401).send({ msg: 'invalid password' })
  }

  const userForToken = {
    user: userLogin.email,
    id: userLogin.id,
  }

  const token = jwt.sign(userForToken, process.env.SECRET)
  res.status(200).json({
    token,
    id: userLogin.id,
    user: userLogin.email,
    name: userLogin.first_name,
  })
})

module.exports = loginRouter
