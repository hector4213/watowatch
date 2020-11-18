DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS movie_lists CASCADE;
DROP TABLE IF EXISTS movie_buddies CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS movie_list_items CASCADE;



CREATE TABLE users (
    id SERIAL NOT NULL,
    first_name VARCHAR(250) NOT NULL,
    last_name VARCHAR(250) NOT NULL,
    email VARCHAR(250) NOT NULL,
    password VARCHAR(250) NOT NULL,
    PRIMARY KEY(id)
);


CREATE TABLE movie_lists(
    id SERIAL NOT NULL,
    title VARCHAR(250) NOT NULL,
    user_id INT,
    PRIMARY KEY (id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);


CREATE TABLE movie_buddies (
    id SERIAL NOT NULL,
    movie_lists_id INT,
    user_id INT,
    PRIMARY KEY(id),
    FOREIGN KEY(movie_lists_id) REFERENCES movie_lists(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id)
);


CREATE TABLE movies (
    id SERIAL NOT NULL,
    title VARCHAR(255),
    genre VARCHAR(255),
    tvdb_movieid INT,
    PRIMARY KEY (id)
);


CREATE TABLE movie_list_items (
    id SERIAL NOT NULL,
    movie_lists_id INT,
    movies_id INT,
    seen BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY(id),
    FOREIGN KEY(movie_lists_id) REFERENCES movie_lists(id) ON DELETE CASCADE,
    FOREIGN KEY(movies_id) REFERENCES movies(id) ON DELETE CASCADE
);