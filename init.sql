-- -- USE THIS if you are manually initiating DB instead of using Docker
-- SHOW server_encoding;
-- SET client_encoding TO 'UTF8';

-- -- Create user
-- CREATE ROLE YOUR_NAME WITH PASSWORD 'YOUR_PASS' LOGIN;

-- -- Create DB
-- CREATE DATABASE YOUR_DATABASE WITH OWNER YOUR_NAME ENCODING 'UTF8' LOCALE 'C';

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
  name VARCHAR(20) NOT NULL, --e.g. db tables, services
  uri TEXT NOT NULL UNIQUE,
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
INSERT INTO resource(name, uri)
VALUES ('userpool', 'jrn;;apiserver;auth;userpool');

-- Create roles
INSERT INTO user_role(name)
VALUES ('root'),('guest');

-- Give access according to roles
INSERT INTO access_control(role_id, resource_id, readable, writable)
SELECT UR.id, RS.id, true, true
FROM user_role as UR CROSS JOIN resource as RS
WHERE UR.name='root' -- set true for all resources
ON CONFLICT DO NOTHING;

INSERT INTO access_control(role_id, resource_id, readable, writable)
SELECT UR.id, RS.id, true, false
FROM user_role as UR CROSS JOIN resource as RS
WHERE UR.name='guest' AND RS.name='userpool'
ON CONFLICT DO NOTHING;
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
INSERT INTO resource(name, uri)
VALUES
('topic', 'jrn;;apiserver;pushnoti;topic'),
('subscription', 'jrn;;apiserver;pushnoti;subscription');
---- END: Push Notification DB ----

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


-- Give full access to root
INSERT INTO access_control(role_id, resource_id, readable, writable)
SELECT UR.id, RS.id, true, true
FROM user_role as UR CROSS JOIN resource as RS
WHERE UR.name='root' -- set true for all resources
ON CONFLICT DO NOTHING;
