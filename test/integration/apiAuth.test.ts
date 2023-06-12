import { Express } from 'express';
import { Server } from 'http';
import { QueryResult } from 'pg';
import supertest from 'supertest';
import hash from '../../src/utils/hash';
import initTest from '../initTest';
import { apiPrefix, createRandomUser, getToken, testObj } from '../testUtil';

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
  }, 10000);
  afterAll(async () => {
    await db.pool.end();
    server.close();
  });

  describe('POST /auth/user', () => {
    const endPoint = apiPrefix + '/auth/user';
    const sqlUser = `SELECT id FROM userpool WHERE email=$1::VARCHAR(50)`;

    it('should fail to create a user and return 400 when invalid role detected', async () => {
      const invalidRole = '123';
      const testUser = 'test@mycompany.com';
      const data = { email: testUser, password: testObj.password, role_name: invalidRole };

      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(400);

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a user and return 400 when invalid email detected', async () => {
      const invalidEmail = 'test_mycompany.com';
      const data = {
        email: invalidEmail,
        password: testObj.password,
        role_name: testObj.role.user,
      };

      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(400);

      const check: QueryResult = await db.query(sqlUser, [invalidEmail]);
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

    it('should fail to get info of a user when invalid token is presented', async () => {
      const testUser = await createRandomUser(db);
      const accessToken = 'invalidToken';

      const res = await supertest(app)
        .get(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(401);
    });

    it('should read info of a user and return 200 with the info', async () => {
      const testUser = await createRandomUser(db);
      const accessToken = await getToken(app, testUser);

      const res = await supertest(app)
        .get(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email');
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

    it('should fail to get info of a user when invalid token is presented', async () => {
      const accessToken = 'invalidToken';

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(401);
    });

    it('should return 200 even if no new info is given', async () => {
      const testUser = await createRandomUser(db);
      const accessToken = await getToken(app, testUser);

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send({});
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

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(newInfo);
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

    it('should fail to delete a user when invalid token is presented', async () => {
      const testUser = await createRandomUser(db);
      const accessToken = 'invalidToken';

      const res = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(401);

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      expect(check.rowCount).toBe(1);
    });

    it('should delete a user successfully when valid token is presented', async () => {
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

    it('should fail to delete a user when no user can be found in DB', async () => {
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
  });

  describe('POST /auth/token', () => {
    const endPoint = apiPrefix + '/auth/token';
    const sqlToken = `SELECT token FROM refresh_token
    WHERE user_id=(SELECT id FROM userpool WHERE email=$1::VARCHAR(50))
    AND device=$2::VARCHAR(50)`;
    const data = { device: testObj.device };

    it('should fail to create a token and return 400 when invalid email detected', async () => {
      const invalidEmail = 'test_mycompany.com';
      const res = await supertest(app)
        .post(endPoint)
        .auth(invalidEmail, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(400);

      const check: QueryResult = await db.query(sqlToken, [invalidEmail, testObj.device]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a token and return 401 when no authorization header found', async () => {
      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(401);
    });

    it('should fail to create a token and return 401 when no password found', async () => {
      const testUser = await createRandomUser(db);
      const invalid_password = '';

      const res = await supertest(app)
        .post(endPoint)
        .auth(testUser, invalid_password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(401);

      const check: QueryResult = await db.query(sqlToken, [testUser, testObj.device]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a token and return 401 when wrong auth scheme detected', async () => {
      const testUser = await createRandomUser(db);

      const res = await supertest(app)
        .post(endPoint)
        .auth(testUser, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(401);

      const check: QueryResult = await db.query(sqlToken, [testUser, testObj.device]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a token and return 401 when wrong password detected', async () => {
      const testUser = await createRandomUser(db);
      const wrongPassword = 'password';

      const res = await supertest(app)
        .post(endPoint)
        .auth(testUser, wrongPassword, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(401);

      const check: QueryResult = await db.query(sqlToken, [testUser, testObj.device]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a token and return 401 when unregistered email detected', async () => {
      const unregisteredUser = 'not-registered@email.com';
      const res = await supertest(app)
        .post(endPoint)
        .auth(unregisteredUser, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(401);

      const check: QueryResult = await db.query(sqlToken, [unregisteredUser, testObj.device]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a token and return 400 when device is not found in req body', async () => {
      const testUser = await createRandomUser(db);
      const noDevice = {};

      const res = await supertest(app)
        .post(endPoint)
        .auth(testObj.user, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(noDevice);
      expect(res.status).toBe(400);

      const check: QueryResult = await db.query(sqlToken, [testUser, testObj.device]);
      expect(check.rowCount).toBe(0);
    });

    it('should create access_token and refresh_token and return 201 with them when correct credentials presented', async () => {
      const testUser = await createRandomUser(db);

      const res = await supertest(app)
        .post(endPoint)
        .auth(testUser, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');

      const hashedToken = await hash.sha256(res.body.refresh_token);
      const check: QueryResult = await db.query(sqlToken, [testUser, testObj.device]);
      expect(check.rowCount).toBe(1);
      expect(check.rows[0].token).toBe(hashedToken);
    });

    it('should create access_token and refresh_token and return 201 with them when correct credentials presented repeatedly', async () => {
      const testUser = await createRandomUser(db);

      const resOld = await supertest(app)
        .post(endPoint)
        .auth(testUser, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(data);
      expect(resOld.status).toBe(201);
      const hashedTokenOld = await hash.sha256(resOld.body.refresh_token);

      const resNew = await supertest(app)
        .post(endPoint)
        .auth(testUser, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(data);
      expect(resNew.status).toBe(201);
      const hashedTokenNew = await hash.sha256(resNew.body.refresh_token);

      const check: QueryResult = await db.query(sqlToken, [testUser, testObj.device]);
      expect(check.rowCount).toBe(1);
      expect(check.rows[0].token).not.toBe(hashedTokenOld);
      expect(check.rows[0].token).toBe(hashedTokenNew);
    });
  });

  describe('POST /auth/refresh', () => {
    const endPoint = apiPrefix + '/auth/refresh';
    const sqlToken = `SELECT token FROM refresh_token
    WHERE user_id=(SELECT id FROM userpool WHERE email=$1::VARCHAR(50))
    AND device=$2::VARCHAR(50)`;

    it('should failed to create a token and return 401 when no refreshToken found in req body', async () => {
      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send({});

      expect(res.status).toBe(401);
    });

    it('should create access_token and refresh_token and return 201 with them when valid refreshToken presented', async () => {
      const testUser = await createRandomUser(db);

      const token = await supertest(app)
        .post(apiPrefix + '/auth/token')
        .auth(testUser, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send({ device: testObj.device });
      expect(token.status).toBe(201);

      const refresh_token = token.body.refresh_token;
      const res = await supertest(app)
        .post(endPoint)
        .set('Accept', 'application/json')
        .send({ refresh_token });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');

      const hashedToken = await hash.sha256(res.body.refresh_token);
      const check: QueryResult = await db.query(sqlToken, [testUser, testObj.device]);
      expect(check.rowCount).toBe(1);
      expect(check.rows[0].token).toBe(hashedToken);
    });

    it('should delete token in DB when refresh token reuse detected', async () => {
      const testUser = await createRandomUser(db);

      const tokenOld = await supertest(app)
        .post(apiPrefix + '/auth/token')
        .auth(testUser, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send({ device: testObj.device });
      expect(tokenOld.status).toBe(201);
      const oldRefreshToken = tokenOld.body.refresh_token;

      const tokenNew = await supertest(app)
        .post(apiPrefix + '/auth/token')
        .auth(testUser, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send({ device: testObj.device });
      expect(tokenNew.status).toBe(201);

      const res = await supertest(app)
        .post(endPoint)
        .set('Accept', 'application/json')
        .send({ refresh_token: oldRefreshToken });

      expect(res.status).toBe(401);

      const check: QueryResult = await db.query(sqlToken, [testUser, testObj.device]);
      expect(check.rowCount).toBe(0);
    });
  });
});
