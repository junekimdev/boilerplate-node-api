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
---- START: AUTH DB ----
CREATE TABLE user_role (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO user_role(name) VALUES ('public'); -- Create special user_role

CREATE TABLE resource (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL, --e.g. db tables, services
  uri TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- root shall bypass access_control
CREATE TABLE access_control (
  role_id INT NOT NULL REFERENCES user_role ON DELETE CASCADE,
  resource_id INT NOT NULL REFERENCES resource ON DELETE CASCADE,
  writable BOOLEAN NOT NULL,
  readable BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(role_id, resource_id)
);

CREATE TABLE userpool (
  id SERIAL PRIMARY KEY,
  email VARCHAR(50) NOT NULL UNIQUE,
  pw CHAR(44), --SHA256 in base64 encoding
  salt CHAR(16), --nodejs crypto.randomBytes(12) in base64 encoding
  role_id INT REFERENCES user_role ON DELETE RESTRICT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_token (
  user_id INT NOT NULL REFERENCES userpool ON DELETE CASCADE,
  device TEXT NOT NULL,
  token CHAR(44), --hashed with SHA256 in base64 encoding
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, device)
);
---- END: AUTH DB ----

------------------------------------------------------

---- START: Push Notification DB ----
CREATE TABLE topic (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscription (
  id SERIAL PRIMARY KEY,
  sub TEXT NOT NULL UNIQUE,
  topic_id INT NOT NULL REFERENCES topic ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
---- END: Push Notification DB ----

-----------------------REQUIRED-----------------------

-----------------------EXAMPLE-----------------------

-- INSERT INTO user_role(name) VALUES ('api_user');

-- INSERT INTO resource(name, uri)
-- VALUES
-- ('userpool', 'jrn;;apiserver;auth;userpool'),
-- ('topic', 'jrn;;apiserver;pushnoti;topic'),
-- ('subscription', 'jrn;;apiserver;pushnoti;subscription');

-- WITH roleT AS (SELECT id FROM user_role WHERE name='api_user')
-- INSERT INTO access_control(role_id, resource_id, writable, readable)
-- SELECT
--   roleT.id,
--   (SELECT id FROM resource WHERE name='userpool'),
--   false, true
-- FROM roleT
-- UNION
-- SELECT
--   roleT.id,
--   (SELECT id FROM resource WHERE name='topic'),
--   true, true
-- FROM roleT
-- UNION
-- SELECT
--   roleT.id,
--   (SELECT id FROM resource WHERE name='subscription'),
--   true, true
-- FROM roleT;
