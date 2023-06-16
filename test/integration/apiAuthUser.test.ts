import { Express } from 'express';
import { Server } from 'http';
import { QueryResult } from 'pg';
import supertest from 'supertest';
import hash from '../../src/utils/hash';
import initTest from '../initTest';
import { apiPrefix, createRandomUser, getTester, getToken, testObj } from '../testUtil';

const testName = 'test_auth';
const testPort = '3001';

describe('Test /auth', () => {
  let app: Express;
  let server: Server;
  let db: any;

  beforeAll(async () => {
    await initTest(testName, testPort);
    const mod: any = require('../../src/server');
    app = mod.default;
    server = mod.server;
    db = require('../../src/utils/db');
  }, 60000);
  afterAll(async () => {
    await db.pool.end();
    server.close();
  });

  describe('common tests', () => {
    const endpoints = [
      { method: 'GET', url: `${apiPrefix}/auth/user` },
      { method: 'PUT', url: `${apiPrefix}/auth/user` },
      { method: 'DELETE', url: `${apiPrefix}/auth/user` },
      { method: 'PUT', url: `${apiPrefix}/auth/user/pass` },
    ];

    it.each(endpoints)(
      '$method $url should fail when when invalid token is presented',
      async ({ method, url }) => {
        const accessToken = 'invalidToken';

        const res = await getTester(app, method, url)
          .auth(accessToken, { type: 'bearer' })
          .set('Accept', 'application/json');
        expect(res.status).toBe(401);
      },
    );
  });

  describe('POST /auth/user', () => {
    const endPoint = apiPrefix + '/auth/user';
    const sqlUser = `SELECT id FROM userpool WHERE email=$1::VARCHAR(50)`;

    it('should fail to create a user and return 404 when non-existing role is passed', async () => {
      const invalidRole = '123';
      const testUser = `${hash.createUUID()}@test.io`;
      const data = { email: testUser, password: testObj.password, role_name: invalidRole };

      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(404);

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a user return 409 when email already exists', async () => {
      const testUser = await createRandomUser(db, testObj.role.user);
      const data = { email: testUser, password: testObj.password, role_name: testObj.role.user };

      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(409);

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      expect(check.rowCount).toBe(1);
    });

    it('should create a user and return 201 with user_id', async () => {
      const testUser = `${hash.createUUID()}@test.io`;
      const data = { email: testUser, password: testObj.password, role_name: testObj.role.user };

      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user_id');

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      expect(check.rowCount).toBe(1);
    });

    it('should create a user with additional info and return 201 with user_id', async () => {
      const testUser = `${hash.createUUID()}@test.io`;
      const data = {
        email: testUser,
        password: testObj.password,
        role_name: testObj.role.user,
        surname: testObj.surname,
        given_name: testObj.givenName,
      };

      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user_id');

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      expect(check.rowCount).toBe(1);
    });

    it('should create an admin and return 201 with user_id', async () => {
      const testUser = `${hash.createUUID()}@test.io`;
      const data = { email: testUser, password: testObj.password, role_name: testObj.role.admin };

      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user_id');

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      expect(check.rowCount).toBe(1);
    });
  });

  describe('GET /auth/user', () => {
    const endPoint = apiPrefix + '/auth/user';
    const sqlUser = `SELECT * FROM userpool WHERE email=$1::VARCHAR(50)`;

    it('should read info of a user and return 200 with the info', async () => {
      const testUser = await createRandomUser(db);
      const accessToken = await getToken(app, testUser);

      const res = await supertest(app)
        .get(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user_id');
      expect(res.body).toHaveProperty('email');
      expect(res.body).toHaveProperty('role_name');
      expect(res.body).toHaveProperty('surname');
      expect(res.body).toHaveProperty('given_name');
      expect(res.body).toHaveProperty('last_login');
      expect(res.body).toHaveProperty('created_at');

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      const userInfo = check.rows[0];
      expect(userInfo.id).toEqual(expect.any(Number));
      expect(userInfo.email).toEqual(testUser);
      expect(userInfo.surname).toEqual(testObj.surname);
      expect(userInfo.given_name).toEqual(testObj.givenName);
      expect(userInfo.last_login).toEqual(expect.any(Date));
      expect(userInfo.created_at).toEqual(expect.any(Date));
    });
  });

  describe('PUT /auth/user', () => {
    const endPoint = apiPrefix + '/auth/user';
    const sqlUser = `SELECT * FROM userpool WHERE email=$1::VARCHAR(50)`;

    it('should return 200 even if update_data is an empty object', async () => {
      const testUser = await createRandomUser(db);
      const accessToken = await getToken(app, testUser);
      const data = { update_data: {} };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      console.log(res.body);
      expect(res.status).toBe(200);

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      const userInfo = check.rows[0];
      expect(userInfo.surname).toEqual(testObj.surname);
      expect(userInfo.given_name).toEqual(testObj.givenName);
    });

    it('should update user info and return 200', async () => {
      const testUser = await createRandomUser(db);
      const accessToken = await getToken(app, testUser);
      const newInfo = { surname: 'new_surname', given_name: 'new_given_name' };
      const data = { update_data: newInfo };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      const userInfo = check.rows[0];
      expect(userInfo.surname).toEqual(newInfo.surname);
      expect(userInfo.given_name).toEqual(newInfo.given_name);
    });
  });

  describe('DELETE /auth/user', () => {
    const endPoint = apiPrefix + '/auth/user';
    const sqlUser = `SELECT id FROM userpool WHERE email=$1::VARCHAR(50)`;

    it('should fail to delete a user when user does not exist', async () => {
      const testUser = await createRandomUser(db);
      const accessToken = await getToken(app, testUser);

      // delete the user
      const res = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(200);

      // try to delete again
      const resAgain = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json');
      expect(resAgain.status).toBe(404);
    });

    it('should delete a user', async () => {
      const testUser = await createRandomUser(db);
      const accessToken = await getToken(app, testUser);

      const res = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(200);

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      expect(check.rowCount).toBe(0);
    });
  });

  describe('PUT /auth/user/pass', () => {
    const endPoint = apiPrefix + '/auth/user/pass';
    const sqlPwdByEmail = `SELECT pw, salt FROM userpool WHERE email=$1::VARCHAR(50)`;
    const sqlPwdById = `SELECT pw, salt FROM userpool WHERE id=$1::INT`;
    const password = 'new-password';

    it('should update pwd', async () => {
      const testUser = await createRandomUser(db);
      const accessToken = await getToken(app, testUser);
      const data = { password };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);

      const check = await db.query(sqlPwdByEmail, [testUser]);
      expect(check.rowCount).toBe(1);
      const { pw, salt } = check.rows[0];
      const hashed = await hash.passSalt(password, salt);
      expect(pw).toBe(hashed);
    });

    it('should ignore user_id in req.body when the user is not an admin', async () => {
      const testUser = await createRandomUser(db);
      const accessToken = await getToken(app, testUser);
      const userId = 2;
      const data = { password, user_id: userId };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);

      const checkOwn = await db.query(sqlPwdByEmail, [testUser]);
      expect(checkOwn.rowCount).toBe(1);
      const { pw, salt } = checkOwn.rows[0];
      const hashed = await hash.passSalt(password, salt);
      expect(pw).toBe(hashed);

      const checkOthers = await db.query(sqlPwdById, [userId]);
      expect(checkOthers.rowCount).toBe(1);
      const pwOthers = checkOthers.rows[0].pw;
      expect(pwOthers).not.toBe(hashed);
    });
  });
});
