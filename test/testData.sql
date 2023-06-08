-- Create resources
INSERT INTO resource(name, uri)
VALUES
('userpool', 'jrn;;apiserver;auth;userpool'),
('topic', 'jrn;;apiserver;pushnoti;topic'),
('subscription', 'jrn;;apiserver;pushnoti;subscription');

-- Create roles
INSERT INTO user_role(name)
VALUES
('guest'),('admin1'),('user1');

-- Give access according to roles
WITH roleT AS (SELECT id FROM user_role WHERE name='guest')
INSERT INTO access_control(role_id, resource_id, readable, writable)
SELECT
  roleT.id,
  (SELECT id FROM resource WHERE name='userpool'),
  true, false
FROM roleT;

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
FROM roleT;

-- Create a topic for Push
INSERT INTO topic(name) VALUES ('test-topic');
