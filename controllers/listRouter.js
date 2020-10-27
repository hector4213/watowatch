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
listRouter.get('/shared/:id', async (req, res) => {
  const { id } = req.params
  const allLists = await pool.query(
    `
    SELECT movie_lists.id AS list_id, movie_lists.title, movie_lists.user_id, b.first_name AS author, json_agg(DISTINCT movies) AS movies, json_agg( DISTINCT ( users.first_name, users.id)) AS buddy_ids
    FROM movie_lists
    INNER JOIN movie_list_items ON movie_lists.id = movie_list_items.movie_lists_id
    INNER JOIN movies ON movies.id = movie_list_items.movies_id
    INNER JOIN movie_buddies ON movie_buddies.movie_lists_id = movie_lists.id
    INNER JOIN users ON movie_buddies.user_id = users.id
    INNER JOIN users b ON movie_lists.user_id = b.id
    WHERE movie_buddies.user_id = $1
    GROUP BY 1, 4;   
    `,
    [id]
  )
  res.status(200).json(allLists.rows)
})

//get specific movie list with movies and buddies OK(maybe show names and ids for front end)

// listRouter.get('/:id', async (req, res) => {
//   const { id } = req.params

//   const userListTitle = await pool.query(
//     `    SELECT movie_lists.id, movie_lists.title, json_agg(DISTINCT movies) AS movies, json_agg(DISTINCT movie_buddies.user_id) AS buddy_ids
//       FROM movie_lists
//       LEFT JOIN movie_list_items ON movie_lists.id = movie_list_items.movie_lists_id
//       LEFT JOIN movies ON movies.id = movie_list_items.movies_id
//       LEFT JOIN movie_buddies ON movie_buddies.movie_lists_id = movie_lists.id
//       WHERE movie_lists.id = $1
//       GROUP BY 1`,
//     [id]
//   )
//   res.status(200).json(userListTitle.rows[0])
// })

listRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  const userCollection = await pool.query(
    `
    SELECT movie_lists.title, movie_lists.id as list_id, movie_lists.user_id, COALESCE(json_agg(DISTINCT movies)filter(where movies.tvdb_movieid IS NOT NULL),'[]') as movies, COALESCE( json_agg( DISTINCT ( users.first_name, users.id))filter(WHERE users.first_name IS NOT NULL), '[]') AS buddy_ids  FROM movie_lists
   LEFT JOIN movie_list_items ON movie_lists.id = movie_list_items.movie_lists_id
   LEFT JOIN movies ON movies.id = movie_list_items.movies_id
  FULL OUTER JOIN movie_buddies on movie_buddies.movie_lists_id = movie_lists.id
  FULL OUTER JOIN users ON movie_buddies.user_id = users.id
  WHERE movie_lists.user_id = $1
  GROUP BY 2`,
    [id]
  )
  console.log(userCollection.rows)
  res.status(200).json(userCollection.rows)
})

// Either logged user, or buddied user can add movie to list

listRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  console.log(id)
  const { title, genre, tvdb_movieid } = req.body
  const decodedToken = jwt.verify(req.token, process.env.SECRET)
  if (!req.token) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }
  if (!title || !genre || !tvdb_movieid || !decodedToken) {
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
    const addMovie = await pool.query(
      `
        INSERT INTO movies(title, genre, tvdb_movieid) VALUES($1, $2, $3) RETURNING id 
        `,
      [title, genre, tvdb_movieid]
    )

    const isInList = await pool.query(
      `
      SELECT movies.tvdb_movieid FROM movie_lists
      INNER JOIN movie_list_items ON movie_lists.id = movie_list_items.movie_lists_id
      INNER JOIN movies ON movie_list_items.movies_id = movies.id
      WHERE movie_lists.user_id = $1
      GROUP BY movie_lists.user_id, movie_lists.id, movies.id
        `,
      [decodedToken.id]
    )
    const inList = isInList.rows.includes(tvdb_movieid)

    if (!inList) {
      const addToListItems = await pool.query(
        `
          INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES($1, $2)
          `,
        [id, addMovie.rows[0].id]
      )
      return res.status(204).json(addMovie.rows[0].id)
    }
  }
  return res.status(401).json({ error: 'User is neither author or a buddy' })
})

//Add a movie buddie to list OK

listRouter.post('/:id/buddies/add', async (req, res) => {
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
  const { buddyId } = req.query

  if (!buddyId) {
    return res.status(400).json({ error: 'missing buddy id' })
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
    return res.status(204).json(deleteBuddy.rows)
  }
})

//Deletes ENTIRE movie list by id checks if current user is author

listRouter.delete('/:id', async (req, res) => {
  const { id } = req.params

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
    const deletedListItem = await pool.query(
      'DELETE FROM movie_lists WHERE movie_lists.id = $1',
      [id]
    )
    return res.status(204).json('List Deleted')
  }
  res.status(401).json({ error: 'List can only be deleted by author' })
})

//Remove a movie by either author or buddy(editing is why put request )
listRouter.put('/:id/movies', async (req, res) => {
  const { id } = req.params
  const { movieId } = req.body
  const decodedToken = jwt.verify(req.token, process.env.SECRET)
  if (!req.token || !decodedToken.id) {
    res.status(401).json({ error: 'token missing or invalid' })
  }

  const isListAuthor = await pool.query(
    `
  SELECT *
  FROM movie_lists
  WHERE movie_lists.id = $1 AND movie_lists.user_id = $2
  `,
    [id, decodedToken.id]
  )

  const canBuddyDelete = await pool.query(
    `
    SELECT *
    FROM movie_buddies
    WHERE movie_buddies.movie_lists_id = $1 AND movie_buddies.user_id = $2
  `,
    [id, decodedToken.id]
  )

  if (isListAuthor.rows.length > 0 || canBuddyDelete.rows.length > 0) {
    const deletedListItem = await pool.query(
      `
      DELETE FROM movie_list_items
      WHERE movie_list_items.movies_id IN (
      SELECT movie_list_items.movies_id FROM movie_list_items
      INNER JOIN movies ON movies.id = movie_list_items.movies_id
      WHERE movie_list_items.movie_lists_id = $1 AND movies.tvdb_movieid = $2
)
      `,
      [id, movieId]
    )
    console.log(deletedListItem)
    return res.status(204).json({ msg: 'Movie Deleted!' })
  }
  return res
    .status(401)
    .json({ error: 'Only an author or buddy can delete a movie' })
})

module.exports = listRouter
