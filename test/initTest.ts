import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { SQL_INSERT_USER } from '../src/services/createUser/provider';
import { testObj } from './testUtil';

const createUser = async (
  client: Client,
  username: string,
  rolename: string,
  surname: string,
  givenName: string,
) => {
  const salt = crypto.randomBytes(12).toString('base64');
  const pw = testObj.password + salt;
  const hashedPW = crypto.createHash('sha256').update(pw).digest('base64');
  const params = [username, hashedPW, salt, rolename, surname, givenName];
  await client.query(SQL_INSERT_USER, params);
};

const init = async (testName: string, port: string) => {
  const buf = await fs.promises.readFile(path.resolve(__dirname, '../init.sql'));
  const sqlInit = buf.toString();

  const root = new Client({
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });
  // In node-postgres, prepared statements cannot be used for CREATE or DROP statements
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
  await createUser(client, testObj.admin, testObj.role.admin, testObj.surname, testObj.givenName);
  await createUser(client, testObj.user, testObj.role.user, testObj.surname, testObj.givenName);
  await client.query('INSERT INTO topic(name) VALUES ($1::TEXT);', [testObj.pushTopic]);
  await client.end();

  process.env.TEST_NAME = testName;
  process.env.PORT = port;
};

export default init;
