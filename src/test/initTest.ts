import { readFileSync } from 'fs';
import path from 'path';
import { Client } from 'pg';

const init = async (testName: string, port: string) => {
  const sqlInitFile = readFileSync(path.resolve(__dirname, '../../init.sql'));
  const sqlInit = sqlInitFile.toString();
  const sqlPopFile = readFileSync(path.resolve(__dirname, '../../example.sql'));
  const sqlPop = sqlPopFile.toString();

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
  await client.end();

  process.env.TEST_NAME = testName;
  process.env.PORT = port;
};

export default init;
