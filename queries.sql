
/* User creates a new movie_list*/

INSERT INTO movie_lists(title, user_id) VALUES('Golf movies i loooove', 4);

/* User changes their movie_lists title */

UPDATE movie_lists
SET title = 'Golf moviesssz'
WHERE user_id = 4 AND movie_lists.id = 1;

/* User adds a movie to their list */

INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(1, 6); 

/* User removes a movie from their list */

DELETE FROM movie_list_items
WHERE movie_lists_id = 1 AND movies_id = 6;

/* User deletes entire movie_list*/
DELETE FROM movie_list
WHERE movie_lists.id = 1;

/*GET a users list of movie_lists*/
SELECT movie_lists.id, movie_lists.title
FROM movie_lists
WHERE user_id = 1;

/*GET the movies in a specific movie_list*/
SELECT movies.title, movies.genre, movies.tvdb_movieid FROM
movie_list_items
INNER JOIN movies ON movie_list_items.movies_id = movies.id
WHERE movie_lists_id = 1;

/*GET a movie_list that shows which buddies are part of it*/



SELECT * 
FROM movie_lists
WHERE movie_lists.id IN(SELECT movie_lists_id FROM movie_list_items INNER JOIN movies ON movies.id = movie_list_items.movies_id)




/* Get a table of which users(movie buddies) belong to which list*/

SELECT movie_lists.id AS listId, movie_lists.title, users.first_name
FROM users
INNER JOIN movie_buddies ON users.id = movie_buddies.user_id
INNER JOIN movie_lists ON movie_lists.id = movie_buddies.movie_lists_id;


/* test*/
INSERT INTO movies(title, genre, tvdb_movieid) VALUES('Space Test', 'Action', 3434) RETURNING id AS last_id;
INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(1, last_id);

















INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(1, 7);
INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(1, 8);

/* User adds basketball movies to their list*/

INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES (3, 1);
INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES (3, 2);
INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES (3, 3);

/* User(Tiger Woods) wants to see his movie lists title and movies ?????*/

SELECT movie_lists.title AS list_title, movies.title
FROM movie_lists 
LEFT JOIN movie_list_items
ON movie_lists.id = movie_list_items.movie_lists_id
LEFT JOIN movies
ON movies_id = movies.id
WHERE movie_lists.user_id = 4;

/* User(Tiger Woods) wants to see his list of movie lists */
 SELECT movie_lists.title from movie_lists
 WHERE movie_lists.user_id = 4;

 /* User(Tiger Woods) wants to delete a movie from his golf movie list */

 DELETE FROM movie_list_items 
 WHERE movie_lists_id = 1 AND movies_id = 6;

/* User(Tiger Woods) wants to edit his movie_lists title name */
UPDATE movie_lists
SET title = 'Golf moviesssz'
WHERE user_id = 4 AND movie_lists.id = 1;






/* User(Homer) adds a movie to his movie list */

INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(2, 9);
