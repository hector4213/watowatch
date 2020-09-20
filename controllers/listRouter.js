const listRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const pool = require('../db')

//Creates new movie list OK

listRouter.post('/', async (req, res) => {
  const { title } = req.body
  const decodedToken = jwt.verify(req.token, process.env.SECRET)
  if (!req.token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }
  const newMovieList = await pool.query(
    'INSERT INTO movie_lists(title, user_id) VALUES($1, $2)',
    [title, decodedToken.id]
  )
  res.status(201).json(newMovieList.rows[0])
})

//get all movielists from all users with user buddies (search?) OK
listRouter.get('/', async (req, res) => {
  const allLists = await pool.query(`
    SELECT movie_lists.id, movie_lists.title, json_agg(DISTINCT movies) AS movies, json_agg(DISTINCT movie_buddies.user_id) AS buddy_ids
    FROM movie_lists
    INNER JOIN movie_list_items ON movie_lists.id = movie_list_items.movie_lists_id
    INNER JOIN movies ON movies.id = movie_list_items.movies_id
    INNER JOIN movie_buddies ON movie_buddies.movie_lists_id = movie_lists.id
    GROUP BY 1;   
    `)
  res.status(200).json(allLists.rows)
})

//get specific movie list with movies and buddies OK(maybe show names and ids for front end)

listRouter.get('/:id', async (req, res) => {
  const { id } = req.params

  const userListTitle = await pool.query(
    `    SELECT movie_lists.id, movie_lists.title, json_agg(DISTINCT movies) AS movies, json_agg(DISTINCT movie_buddies.user_id) AS buddy_ids
      FROM movie_lists
      LEFT JOIN movie_list_items ON movie_lists.id = movie_list_items.movie_lists_id
      LEFT JOIN movies ON movies.id = movie_list_items.movies_id
      LEFT JOIN movie_buddies ON movie_buddies.movie_lists_id = movie_lists.id
      WHERE movie_lists.id = $1
      GROUP BY 1`,
    [id]
  )
  res.status(200).json(userListTitle.rows[0])
})

// Add a movie to a list by either user or buddy

//TODO:add user auth to make sure only author can add items OK

listRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const { title, genre, tvdbid } = req.body
  const decodedToken = jwt.verify(req.token, process.env.SECRET)
  if (!req.token) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }
  if (!title || !genre || !tvdbid || !decodedToken) {
    return res.status(400).json({ error: 'missing content' })
  }

  const isListAuthor = await pool.query(
    `
  SELECT *
  FROM movie_lists
  WHERE movie_lists.id = $1 and movie_lists.user_id = $2
  `,
    [id, decodedToken.id]
  )

  const isBuddy = await pool.query(
    `
    SELECT * FROM movie_buddies
    WHERE movie_buddies.movie_lists_id = $1 AND movie_buddies.user_id = $2
  `,
    [id, decodedToken.id]
  )

  if (isListAuthor.rows.length > 0 || isBuddy.rows.length > 0) {
    const isDuplicate = await pool.query(
      `
       SELECT movies.title
       FROM movie_lists
       INNER JOIN movie_list_items ON movie_lists.id = movie_list_items.movie_lists_id
       INNER JOIN movies ON movies.id = movie_list_items.movies_id
       WHERE movies.title = $1
    `,
      [title]
    )
    if (isDuplicate.rows.length < 1) {
      const addMovie = await pool.query(
        `
        INSERT INTO movies(title, genre, tvdb_movieid) VALUES($1, $2, $3) RETURNING id 
        `,
        [title, genre, tvdbid]
      )
      const addToListItems = await pool.query(
        `
        INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES($1, $2)
        `,
        [id, addMovie.rows[0].id]
      )
      return res.status(204).json(addMovie.rows[0].id)
    }
    res.status(400).json({ error: 'Item already in list' })
  }
  res.status(401).json({ error: 'User is neither author or a buddy' })
})

//Add a movie buddie to list OK

listRouter.put('/:id/buddies/add', async (req, res) => {
  const { id } = req.params
  const { buddyId } = req.body
  if (!buddyId) {
    return res.status(400).json({ error: 'missing or incorrect buddy id' })
  }
  const decodedToken = jwt.verify(req.token, process.env.SECRET)

  if (!req.token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }

  const isListAuthor = await pool.query(
    `
    SELECT * 
    FROM movie_lists
    WHERE movie_lists.id = $1 AND movie_lists.user_id = $2
  `,
    [id, decodedToken.id]
  )
  if (isListAuthor.rows[0].user_id === decodedToken.id) {
    //TODO: Use SELECT to check for duplicate buddy
    const isDuplicate = await pool.query(
      `
    SELECT * FROM movie_buddies
    WHERE movie_buddies.movie_lists_id = $1 AND movie_buddies.user_id = $2
  `,
      [id, buddyId]
    )

    if (isDuplicate.rows.length < 1) {
      const addBuddy = await pool.query(
        `
      INSERT INTO movie_buddies(movie_lists_id, user_id) VALUES($1, $2)
    `,
        [id, buddyId]
      )
      return res.status(200).json(addBuddy.rows)
    }
    res.status(409).json({ error: 'Buddy already in list!' })
  }
})

//Remove a movie buddy from list

listRouter.delete('/:id/buddies/delete', async (req, res) => {
  const { id } = req.params
  const { buddyId } = req.body

  if (!buddyId) {
    res.status(400).json({ error: 'missing buddy id' })
  }
  //TODO: Check if user deleting is author of this movie list
  const decodedToken = jwt.verify(req.token, process.env.SECRET)

  if (!req.token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }

  const isListAuthor = await pool.query(
    `
    SELECT * FROM movie_lists
    WHERE movie_lists.id = $1 and movie_lists.user_id = $2
  `,
    [id, decodedToken.id]
  )

  if (isListAuthor.rows[0].user_id === decodedToken.id) {
    const deleteBuddy = await pool.query(
      `
      DELETE FROM movie_buddies
      WHERE movie_buddies.movie_lists_id = $1 and movie_buddies.user_id = $2
      `,
      [id, buddyId]
    )
    res.status(204).json(deleteBuddy.rows)
  }
})

//Deletes a movie list by id

listRouter.delete('/:id', async (req, res) => {
  const { id } = req.params

  const decodedToken = jwt.verify(req.token, process.env.SECRET)
  if (!req.token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }

  const isListAuthor = await pool.query(
    `
  SELECT movie_lists.user_id
  FROM movie_lists
  WHERE movie_lists.id = $1 AND movie_lists.user_id = $2
  `,
    [id, decodedToken.id]
  )

  if (isListAuthor.rows[0].user_id === decodedToken.id) {
    const deletedList = await pool.query(
      'DELETE FROM movie_lists WHERE movie_lists.id = $1',
      [id]
    )
    return res.status(204).json('List Deleted')
  }
  res.status(401).json({ error: 'List can only be deleted by author' })
})

module.exports = listRouter
