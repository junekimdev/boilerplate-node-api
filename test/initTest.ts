import { readFileSync } from 'fs';
import path from 'path';
import { Client } from 'pg';
import { SQL_INSERT_USER } from '../src/services/createUser/provider';
import hash from '../src/utils/hash';
import { testObj } from './testUtil';

const SQL_INSERT_TOPIC = `INSERT INTO topic(name) VALUES ($1::TEXT);`;

const createUser = async (
  client: Client,
  username: string,
  rolename: string,
  surname: string,
  givenName: string,
) => {
  const salt = hash.createSalt();
  const hashedPW = await hash.passSalt(testObj.password, salt);
  await client.query(SQL_INSERT_USER, [username, hashedPW, salt, rolename, surname, givenName]);
};

const init = async (testName: string, port: string) => {
  const sqlInit = readFileSync(path.resolve(__dirname, '../init.sql')).toString();

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
  await createUser(client, testObj.admin, testObj.role.admin, testObj.surname, testObj.givenName);
  await createUser(client, testObj.user, testObj.role.user, testObj.surname, testObj.givenName);
  await client.query(SQL_INSERT_TOPIC, [testObj.pushTopic]);
  await client.end();

  process.env.TEST_NAME = testName;
  process.env.PORT = port;
};

export default init;
