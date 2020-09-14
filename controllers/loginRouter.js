const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const pool = require('../db')
const loginRouter = require('express').Router()

loginRouter.post('/', async (req, res) => {
  const { email, password } = req.body
  const user = await pool.query(
    `
    SELECT *
    FROM users
    WHERE users.email = $1 
    `,
    [email]
  )
  console.log(user.rows[0])
  const passwordCorrect =
    user === null
      ? false
      : await bcrypt.compare(password, user.rows[0].password)
  if (!(user && passwordCorrect)) {
    return res.json({ error: 'invalid email or password' })
  }

  const userForToken = {
    user: user.email,
    id: user.id,
  }

  const token = jwt.sign(userForToken, process.env.SECRET)
  res.status(200).send({ token, user: user.email, name: user.first_name })
})

module.exports = loginRouter
