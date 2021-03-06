
TRUNCATE TABLE movies RESTART IDENTITY CASCADE; /* Clears movies and already cleared movie_list_items */
TRUNCATE TABLE users RESTART IDENTITY CASCADE; /* Clears movie_lists, movie_buddies, movie_list_items */



INSERT INTO users(first_name, last_name, email, password)
VALUES('Micheal', 'Jordan', 'bulls@chicago.com', 'asdfasdf');
INSERT INTO users(first_name, last_name, email, password)
VALUES('Vince', 'Carter', 'dunk@ball.com', 'lovetherraps');
INSERT INTO users(first_name, last_name, email, password)
VALUES('Magic', 'Johnson', 'cured@staypositive.com', 'lakers9999');

INSERT INTO users(first_name, last_name, email, password)
VALUES('Tiger', 'Woods', 'gold@pga.com', 'asdfasdf');
INSERT INTO users(first_name, last_name, email, password)
VALUES('Mike', 'Weir', 'canada@email.ca', 'asdfasdf');
INSERT INTO users(first_name, last_name, email, password)
VALUES('Adam', 'Sandler', 'happy@gilmore.com', 'asdfasasasddf');

INSERT INTO users(first_name, last_name, email, password)
VALUES('Homer', 'Simpson', 'Doughnuts@moes.com', 'springfield99');
INSERT INTO users(first_name, last_name, email, password)
VALUES('Bart', 'Simpson', 'aycaraumba@eatmyshorts.com', 'thrillhouse88');
INSERT INTO users(first_name, last_name, email, password)
VALUES('Ralph', 'Wiggum', 'chewy@starwars.com', 'maythefarcebewithyou');


/* Create movie lists*/
INSERT INTO movie_lists(title, user_id) VALUES('Baller Movies', 1);
INSERT INTO movie_lists(title, user_id) VALUES ('Love me some an Arnold Palmer', 4);
INSERT INTO movie_lists(title, user_id) VALUES('Mellow Yellow', 7);

/*Inserting random movies*/
INSERT INTO movies (title, genre, tvdb_movieid) VALUES ('Love and Basketball', 'Romance', 14736);
INSERT INTO movies (title, genre, tvdb_movieid) VALUES ('Air Bud', 'Family', 20737);
INSERT INTO movies (title, genre, tvdb_movieid) VALUES ('Basketball Diaries', 'Drama', 10474);

INSERT INTO movies (title,  genre, tvdb_movieid) VALUES ('The Terminator', 'Action', 218);
INSERT INTO movies (title, genre, tvdb_movieid) VALUES ('The Simpsons Movie', 'Animation', 35);
INSERT INTO movies (title, genre, tvdb_movieid) VALUES ('The Simpsons: Gone Wild', 'Animation', 622194);

INSERT INTO movies (title, genre, tvdb_movieid) VALUES ('Happy Gilmour', 'Comedy', 9614);
INSERT INTO movies (title, genre, tvdb_movieid) VALUES ('The Glass Castle', 'Drama', 336000);
INSERT INTO movies (title, genre, tvdb_movieid) VALUES ('The Golf Specialist', 'Comedy', 37358);



/* Add movies to list from movies table*/

INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(1, 1);
INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(1, 2);
INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(1, 3);

INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(2, 7);
INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(2, 8);
INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(2, 9);

INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(3, 4);
INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(3, 5);
INSERT INTO movie_list_items(movie_lists_id, movies_id) VALUES(3, 6);

/* Movie buddies are added*/

INSERT INTO movie_buddies(movie_lists_id, user_id) VALUES(1, 2);
INSERT INTO movie_buddies(movie_lists_id, user_id) VALUES(1, 3);

INSERT INTO movie_buddies(movie_lists_id, user_id) VALUES(2, 5);
INSERT INTO movie_buddies(movie_lists_id, user_id) VALUES(2, 6);

INSERT INTO movie_buddies(movie_lists_id, user_id) VALUES(3, 8);
INSERT INTO movie_buddies(movie_lists_id, user_id) VALUES(3, 9);