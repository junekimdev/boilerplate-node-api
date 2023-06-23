-- -- USE THIS if you are manually initiating DB instead of using Docker
-- SHOW server_encoding;
-- SET client_encoding TO 'UTF8';

-- -- Create user
-- CREATE ROLE YOUR_NAME WITH PASSWORD 'YOUR_PASS' LOGIN;

-- -- Create DB
-- CREATE DATABASE YOUR_DATABASE WITH OWNER YOUR_NAME
-- TEMPLATE 'template0'
-- ENCODING 'UTF8'
-- LC_COLLATE 'C'
-- LC_CTYPE 'en_US.UTF-8';

-- \c YOUR_DATABASE
-- SET ROLE YOUR_NAME;

-----------------------START: REQUIRED-----------------------
---- START: AUTH DB ----
CREATE TABLE user_role (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE resource (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE, --e.g. db-tables, services
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- root shall bypass access_control
CREATE TABLE access_control (
  role_id INT NOT NULL REFERENCES user_role ON DELETE CASCADE,
  resource_id INT NOT NULL REFERENCES resource ON DELETE CASCADE,
  readable BOOLEAN NOT NULL,
  writable BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(role_id, resource_id)
);

CREATE TABLE userpool (
  id SERIAL PRIMARY KEY,
  email VARCHAR(50) NOT NULL UNIQUE,
  role_id INT NOT NULL REFERENCES user_role ON DELETE RESTRICT,
  profile_url TEXT,
  surname TEXT,
  given_name TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  pw CHAR(44), --SHA256 in base64 encoding
  salt CHAR(16) --nodejs crypto.randomBytes(12) in base64 encoding
);

CREATE TABLE refresh_token (
  user_id INT NOT NULL REFERENCES userpool ON DELETE CASCADE,
  device TEXT NOT NULL,
  token CHAR(44), --hashed with SHA256 in base64 encoding
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, device)
);

-- Create resources
INSERT INTO resource(name)
VALUES ('userpool');
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

-- Create resources
INSERT INTO resource(name)
VALUES
('topic'),('subscription');
---- END: Push Notification DB ----

---- NOTE: SQLs below this line should come after resource creation ----
-- Create roles
INSERT INTO user_role(name)
VALUES ('root'),('guest');

-- Give access according to roles
INSERT INTO access_control(role_id, resource_id, readable, writable)
SELECT roleT.id, resT.id, true, true
FROM user_role as roleT CROSS JOIN resource as resT
WHERE roleT.name='root' -- set true for all resources
ON CONFLICT DO NOTHING;

INSERT INTO access_control(role_id, resource_id, readable, writable)
SELECT roleT.id, resT.id, true, false
FROM user_role as roleT CROSS JOIN resource as resT
WHERE roleT.name='guest' AND resT.name='userpool'
ON CONFLICT DO NOTHING;

-----------------------END: REQUIRED-----------------------

---------------------EXAMPLE-----------------------
-- Create roles
INSERT INTO user_role(name)
VALUES ('admin1'),('user1');

-- Give access according to roles
WITH roleT AS (SELECT id FROM user_role WHERE name='admin1')
INSERT INTO access_control(role_id, resource_id, readable, writable)
SELECT
  roleT.id,
  (SELECT id FROM resource WHERE name='userpool'),
  true, true
FROM roleT
UNION
SELECT
  roleT.id,
  (SELECT id FROM resource WHERE name='topic'),
  true, true
FROM roleT
UNION
SELECT
  roleT.id,
  (SELECT id FROM resource WHERE name='subscription'),
  true, true
FROM roleT;

WITH roleT AS (SELECT id FROM user_role WHERE name='user1')
INSERT INTO access_control(role_id, resource_id, readable, writable)
SELECT
  roleT.id,
  (SELECT id FROM resource WHERE name='userpool'),
  true, false
FROM roleT
UNION
SELECT
  roleT.id,
  (SELECT id FROM resource WHERE name='topic'),
  true, false
FROM roleT
UNION
SELECT
  roleT.id,
  (SELECT id FROM resource WHERE name='subscription'),
  false, true
FROM roleT
ON CONFLICT DO NOTHING;
