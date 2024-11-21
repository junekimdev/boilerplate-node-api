import crypto from 'crypto';
import { Express } from 'express';
import path from 'path';
import { PoolClient } from 'pg';
import supertest from 'supertest';
import { SQL_INSERT_PERMIT, SQL_INSERT_ROLE } from '../src/services/createRole/provider';
import { SQL_INSERT_USER } from '../src/services/createUser/provider';

export const apiPrefix = '/api/v1';

export const testObj = {
  admin: `${crypto.randomUUID()}@test.io`,
  user: `${crypto.randomUUID()}@test.io`,
  role: { admin: 'admin1', user: 'user1' },
  password: crypto.randomUUID(),
  device: crypto.randomUUID(),
  surname: 'test-surname',
  givenName: 'test-given-name',
  pushTopic: 'test-topic',
  resources: ['userpool', 'topic', 'subscription'],
  permissions: [
    { res_name: 'userpool', readable: true, writable: false },
    { res_name: 'topic', readable: true, writable: false },
    { res_name: 'subscription', readable: true, writable: false },
  ],
  uploadFilename: { img: 'lenna_100x100.png', txt: 'lorem.txt' },
};

export const getProjectRoot = () => path.resolve(__dirname, '../');

export const getUploadDir = () => {
  const { UPLOAD_ROOT } = process.env;
  if (!UPLOAD_ROOT) throw new Error('UPLOAD_ROOT is undefined');
  return path.join(getProjectRoot(), UPLOAD_ROOT);
};

export const getUploadFilePath = {
  img: () => path.resolve(__dirname, testObj.uploadFilename.img),
  txt: () => path.resolve(__dirname, testObj.uploadFilename.txt),
};

export const getProfileDir = () => {
  const { PUBLIC_PROFILE_DIR } = process.env;
  if (!PUBLIC_PROFILE_DIR) throw new Error('PUBLIC_PROFILE_DIR is undefined');
  return path.join(getProjectRoot(), 'public', PUBLIC_PROFILE_DIR);
};

export const getProfilePath = (filename: string) => path.join(getProfileDir(), filename);

export const createRandomRole = async (db: any) => {
  const roleName = crypto.randomUUID();
  await db.transaction(async (client: PoolClient) => {
    const roleInsert = await client.query(SQL_INSERT_ROLE, [roleName]);
    if (!roleInsert.rowCount) return 0;
    const roleId = roleInsert.rows[0].id as number;

    for (let i = 0; i < testObj.permissions.length; i++) {
      const { res_name, readable, writable } = testObj.permissions[i];
      await client.query(SQL_INSERT_PERMIT, [roleId, res_name, readable, writable]);
    }
  });

  return roleName;
};

export const createRandomUser = async (db: any, role: string = testObj.role.user) => {
  const username = `${crypto.randomUUID()}@test.io`;
  const salt = crypto.randomBytes(12).toString('base64');
  const pw = testObj.password + salt;
  const hashedPW = crypto.createHash('sha256').update(pw).digest('base64');
  const params = [username, hashedPW, salt, role, testObj.surname, testObj.givenName];
  await db.query(SQL_INSERT_USER, params);
  return username;
};

export const getToken = async (app: Express, username: string) => {
  const token = await supertest(app)
    .post(apiPrefix + '/auth/token')
    .auth(username, testObj.password, { type: 'basic' })
    .set('Accept', 'application/json')
    .send({ device: testObj.device });
  return token.body.access_token;
};

export const getTester = (app: Express, method: string, url: string) => {
  let tester: supertest.Test;

  switch (method) {
    case 'POST':
      tester = supertest(app).post(url);
      break;
    case 'GET':
      tester = supertest(app).get(url);
      break;
    case 'PUT':
      tester = supertest(app).put(url);
      break;
    case 'PATCH':
      tester = supertest(app).patch(url);
      break;
    case 'DELETE':
      tester = supertest(app).delete(url);
      break;
    default:
      throw new Error('invalid method');
  }

  return tester;
};

export const getDbErrorMock = (code: string) => {
  const err: any = new Error('DB Error');
  err.code = code;
  return err;
};

export const getRandomPort = () => {
  const min = 3001;
  const max = 4000;
  return `${Math.floor(Math.random() * (max - min) + min)}`;
};
