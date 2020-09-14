const listRouter = require('express').Router()
const pool = require('../db')

//Creates new movie list

listRouter.post('/', async (req, res) => {
  const { title } = req.body
  const { userId } = req.body
  try {
    const newMovieList = await pool.query(
      'INSERT INTO movie_lists(title, user_id) VALUES($1, $2)',
      [title, userId]
    )
    res.status(201).json(newMovieList.rows[0])
  } catch (error) {
    console.log(error)
  }
})

//get all movielists from all users
listRouter.get('/', async (req, res) => {
  try {
    const allLists = await pool.query(`
    SELECT movie_list_items.movie_lists_id, movie_lists.title, movie_lists.user_id AS author_id, json_agg(movies) AS movies
    FROM movies
    INNER JOIN movie_list_items ON movies.id = movie_list_items.movies_id
    INNER JOIN movie_lists ON movie_lists.id = movie_list_items.movie_lists_id
    GROUP BY 1,2,3    
    `)
    res.status(200).json(allLists.rows)
  } catch (error) {
    console.log(error)
  }
})

//user fetches movie from movie_lists.id

listRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const userListTitle = await pool.query(
      `SELECT movie_list_items.movie_lists_id, movie_lists.title, movie_lists.user_id AS author_id, json_agg(movies) as movies
      FROM movies
      INNER JOIN movie_list_items ON movies.id = movie_list_items.movies_id
      INNER JOIN movie_lists ON movie_lists.id = movie_list_items.movie_lists_id
      WHERE movie_lists.id = $1
      GROUP BY 1,2,3`,
      [id]
    )
    res.status(200).json(userListTitle.rows[0])
  } catch (error) {
    console.log(error)
  }
})

// Add a movie to a list

listRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const { title, genre, tvdbid } = req.body

  try {
    //TODO: use select to check if movie exists already
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
    res.status(204).json(addMovie.rows[0].id)
  } catch (error) {
    console.log(error)
  }
})

//Deletes a movie list by id

listRouter.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const deletedList = await pool.query(
      'DELETE FROM movie_lists WHERE movie_lists.id = $1',
      [id]
    )
    res.status(204).json('List Deleted')
  } catch (error) {
    console.log(error)
  }
})

module.exports = listRouter
