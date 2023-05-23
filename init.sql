-- -- USE THIS if you are manually initiating DB instead of using Docker
-- SHOW server_encoding;
-- SET client_encoding TO 'UTF8';

-- -- Create user
-- CREATE ROLE YOUR_NAME WITH PASSWORD 'YOUR_PASS' LOGIN;

-- -- Create DB
-- CREATE DATABASE YOUR_DATABASE WITH OWNER YOUR_NAME ENCODING 'UTF8' LOCALE 'C';

-- \c YOUR_DATABASE
-- SET ROLE YOUR_NAME;

-----------------------REQUIRED-----------------------
-- Create Table
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL, --db tables are resources
  full_uri VARCHAR(50) NOT NULL UNIQUE,
  short_uri VARCHAR(50) UNIQUE
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(50) NOT NULL UNIQUE,
  pw CHAR(44), --SHA256 in base64 encoding
  salt CHAR(16) --nodejs crypto.randomBytes(12) in base64 encoding
);

CREATE TABLE access_control (
  resource_id INT references resources ON DELETE CASCADE,
  user_id INT references users ON DELETE CASCADE,
  write_permit BOOLEAN,
  read_permit BOOLEAN,
  UNIQUE(user_id, resource_id)
);

CREATE TABLE push_subscription (
  id SERIAL PRIMARY KEY,
  sub TEXT NOT NULL UNIQUE
);

-- Create special USER: public
INSERT INTO users(email) VALUES ('public'); --intentional invalid email

----------------------MODIFY TO YOURS----------------------
-- Change URIs
INSERT INTO resources(name, full_uri, short_uri)
VALUES
('user', 'mycompany.user', 'user');
('push_subscription', 'mycompany.push_subscription', 'push_sub');

INSERT INTO access_control(resource_id, user_id, write_permit, read_permit)
SELECT (
  (SELECT id FROM resources WHERE short_uri='user'),
  (SELECT id FROM users WHERE email='public'),
  true, true);

-----------------------REQUIRED-----------------------
