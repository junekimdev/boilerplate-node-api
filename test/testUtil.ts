import { Express } from 'express';
import supertest from 'supertest';
import { SQL_INSERT_USER } from '../src/services/createUser/provider';
import hash from '../src/utils/hash';

export const apiPrefix = '/api/v1';

export const testObj = {
  admin: `${hash.createUUID()}@test.io`,
  user: `${hash.createUUID()}@test.io`,
  role: { admin: 'admin1', user: 'user1' },
  password: hash.createUUID(),
  device: hash.createUUID(),
  surname: 'test-surname',
  givenName: 'test-given-name',
  pushTopic: 'test-topic',
};

export const createRandomUser = async (db: any, role: string = testObj.role.user) => {
  const username = `${hash.createUUID()}@test.io`;
  const salt = hash.createSalt();
  const hashedPW = await hash.passSalt(testObj.password, salt);
  await db.query(SQL_INSERT_USER, [
    username,
    hashedPW,
    salt,
    role,
    testObj.surname,
    testObj.givenName,
  ]);
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
      break;
  }

  return tester;
};
