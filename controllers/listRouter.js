const listRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const pool = require('../db')

//Creates new movie list OK

listRouter.post('/', async (req, res) => {
  const { title } = req.body
  if (title.length > 30 || title.length < 2) {
    return res
      .status(400)
      .json({ error: 'Titles can have  min characters of 3 and a max of 30' })
  }
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
    SELECT movie_lists.id AS list_id, movie_lists.title, movie_lists.user_id, b.first_name AS author, json_agg( DISTINCT jsonb_build_object('db_id', movies.id,'title', movies.title, 'seen', movie_list_items.seen, 'tvdb_movieid', movies.tvdb_movieid, 'genre', movies.genre)) AS movies, json_agg( DISTINCT ( users.first_name, users.id)) AS buddy_ids
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

//Update movie as seen (toggles)

listRouter.put('/:id/movie/:movieId', async (req, res) => {
  const { id, movieId } = req.params
  const updateSeen = pool.query(
    `
  UPDATE movie_list_items
  SET seen = NOT seen
  WHERE movie_list_items.movie_lists_id = $1 AND movie_list_items.movies_id = $2
  `,
    [id, movieId]
  )
  return res.status(201).json({ msg: 'seen status updated' })
})

listRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  const userCollection = await pool.query(
    `
    SELECT movie_lists.title,COALESCE(json_agg(DISTINCT (users.first_name, users.id))FILTER (WHERE users.id IS NOT NULL), '[]') as buddy_ids, movie_lists.id AS list_Id, movie_lists.user_id, COALESCE(json_agg(DISTINCT jsonb_build_object('db_id', movies.id,'title', movies.title, 'seen', movie_list_items.seen, 'tvdb_movieid', movies.tvdb_movieid, 'genre', movies.genre))FILTER (WHERE movies.id IS NOT NULL), '[]') as movies  FROM movie_lists
    FULL OUTER JOIN movie_list_items  ON movie_lists.id = movie_list_items.movie_lists_id
    FULL OUTER JOIN movies ON movies.id = movie_list_items.movies_id
    FULL OUTER JOIN movie_buddies on movie_buddies.movie_lists_id = movie_lists.id
    FULL OUTER JOIN users ON movie_buddies.user_id = users.id
    WHERE movie_lists.user_id = $1
    GROUP BY 3`,
    [id]
  ) //Fix cant see a newly created list
  console.log(userCollection.rows)
  res.status(200).json(userCollection.rows)
})

// Either logged user, or buddied user can add movie to list

listRouter.post('/:id', async (req, res) => {
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
    //check for duplicates with id //pg unique
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

//Delete movie from a list, either buddy or author
listRouter.delete('/:id/movie/:movieId', async (req, res) => {
  const { id, movieId } = req.params

  console.log(movieId)
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
    WHERE movie_list_items.movie_lists_id = $1 AND movie_list_items.movies_id = $2`,
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
