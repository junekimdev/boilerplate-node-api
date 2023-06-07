import { readFileSync } from 'fs';
import path from 'path';
import { Client } from 'pg';
import hash from '../utils/hash';

export const testObj = {
  admin: `${hash.createUUID()}@test.io`,
  user: `${hash.createUUID()}@test.io`,
  password: hash.createUUID(),
  device: hash.createUUID(),
  pushTopic: 'test-topic',
};

const SQL_INSERT_USER = `INSERT INTO userpool(email, pw, salt, role_id)
SELECT
$1::VARCHAR(50), $2::CHAR(44), $3::CHAR(16),
(SELECT id FROM user_role WHERE name=$4::VARCHAR(50))
ON CONFLICT (email) DO NOTHING;`;

const createUser = async (client: Client, username: string, rolename: string) => {
  const salt = hash.createSalt();
  const hashedPW = await hash.sha256(testObj.password + salt);
  await client.query(SQL_INSERT_USER, [username, hashedPW, salt, rolename]);
};

const init = async (testName: string, port: string) => {
  const sqlInit = readFileSync(path.resolve(__dirname, '../../init.sql')).toString();
  const sqlPop = readFileSync(path.resolve(__dirname, './testData.sql')).toString();

  const root = new Client({
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });
  await root.connect();
  await root.query(`DROP DATABASE IF EXISTS ${testName};`);
  await root.query(`DROP ROLE IF EXISTS ${testName};`);
  await root.query(`CREATE ROLE ${testName} WITH SUPERUSER PASSWORD '${testName}' LOGIN;`);
  await root.query(
    `CREATE DATABASE ${testName} WITH OWNER ${testName} ENCODING 'UTF8' LOCALE 'C';`,
  );
  await root.end();

  const client = new Client({
    user: testName,
    password: testName,
    database: testName,
  });
  await client.connect();
  await client.query(sqlInit);
  await client.query(sqlPop);
  await createUser(client, testObj.admin, 'admin1');
  await createUser(client, testObj.user, 'user1');
  await client.end();

  process.env.TEST_NAME = testName;
  process.env.PORT = port;
};

export default init;
