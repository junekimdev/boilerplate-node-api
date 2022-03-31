-- -- USE THIS if you are manually initiating DB instead of using Docker
-- -- Create user
-- CREATE ROLE YOUR_NAME WITH PASSWORD 'YOUR_PASS';

-- -- Create DB
-- CREATE DATABASE YOUR_DATABASE WITH OWNER YOUR_NAME;

-- \c YOUR_DATABASE
-- SET ROLE YOUR_NAME;

-----------------------REQUIRED-----------------------
-- Create Table
CREATE TABLE api_user (
  id SERIAL PRIMARY KEY,
  email VARCHAR(50) NOT NULL UNIQUE,
  pw CHAR(44) NOT NULL, --SHA256 in base64 encoding
  salt CHAR(16) NOT NULL --nodejs crypto.randomBytes(12) in base64 encoding
);

CREATE TABLE push_sub (
  id SERIAL PRIMARY KEY,
  sub TEXT NOT NULL UNIQUE
);
-----------------------REQUIRED-----------------------
