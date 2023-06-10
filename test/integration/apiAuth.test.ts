import { Express } from 'express';
import { Server } from 'http';
import { QueryResult } from 'pg';
import supertest from 'supertest';
import hash from '../../src/utils/hash';
import initTest, { testObj } from '../initTest';

const getToken = async (app: Express, who: string) => {
  const data = { device: testObj.device };
  const token = await supertest(app)
    .post('/api/v1/auth/token')
    .auth(who, testObj.password, { type: 'basic' })
    .set('Accept', 'application/json')
    .send(data);
  return token.body.access_token;
};

describe('Test /api/v1/auth', () => {
  let app: Express;
  let server: Server;
  let db: any;

  beforeAll(async () => {
    await initTest('test_auth', '3001');
    const mod: any = require('../../src/server');
    app = mod.default;
    server = mod.server;
    db = require('../../src/utils/db');
  }, 10000);
  afterAll(async () => {
    await db.pool.end();
    server.close();
  });

  describe('POST /api/v1/auth/user/:role', () => {
    const rootUrl = '/api/v1/auth/user/';
    const sqlUser = `SELECT id FROM userpool WHERE email=$1::VARCHAR(50)`;

    it('should fail to create a user and return 400 when invalid role detected', async () => {
      const testUser = 'test@mycompany.com';
      const endPoint = rootUrl + '123';
      const data = { email: testUser, password: testObj.password };
      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(400);

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a user and return 400 when invalid email detected', async () => {
      const endPoint = rootUrl + testObj.role.user;
      const invalidEmail = 'test_mycompany.com';
      const data = { email: invalidEmail, password: testObj.password };
      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(400);

      const check: QueryResult = await db.query(sqlUser, [invalidEmail]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a user return 409 when email already exists', async () => {
      const endPoint = rootUrl + testObj.role.user;
      const data = { email: testObj.user, password: testObj.password };
      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(409);

      const check: QueryResult = await db.query(sqlUser, [testObj.user]);
      expect(check.rowCount).toBe(1);
    });

    it('should create a user and return 201 with user_id', async () => {
      const endPoint = rootUrl + testObj.role.user;
      const testUser = testObj.role.user + '@mycompany.com';
      const data = { email: testUser, password: testObj.password };
      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user_id');

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      expect(check.rowCount).toBe(1);
    });

    it('should create an admin and return 201 with user_id', async () => {
      const endPoint = rootUrl + testObj.role.admin;
      const testUser = testObj.role.admin + '@mycompany.com';
      const data = { email: testUser, password: testObj.password };
      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user_id');

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      expect(check.rowCount).toBe(1);
    });
  });

  describe('DELETE /api/v1/auth/user', () => {
    const endPoint = '/api/v1/auth/user';
    const sqlUser = `SELECT id FROM userpool WHERE email=$1::VARCHAR(50)`;

    it('should fail to delete a user when invalid token is presented', async () => {
      const accessToken = 'invalidToken';

      // delete the user
      const res = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(401);
    });

    it('should delete a user successfully when valid token is presented', async () => {
      const testUser = 'delete@user.test';
      const cred = { email: testUser, password: testObj.password };
      // create a user
      const user = await supertest(app)
        .post('/api/v1/auth/user/user1')
        .set('Accept', 'application/json')
        .send(cred);
      expect(user.status).toBe(201);

      // get a token
      const accessToken = await getToken(app, testUser);

      // delete the user
      const res = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(200);
    });

    it('should fail to delete a user when no user can be found in DB', async () => {
      const testUser = 'delete@user.test';
      const cred = { email: testUser, password: testObj.password };
      // create a user
      const user = await supertest(app)
        .post('/api/v1/auth/user/user1')
        .set('Accept', 'application/json')
        .send(cred);
      expect(user.status).toBe(201);

      // get a token
      const accessToken = await getToken(app, testUser);

      // delete the user
      const res = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json');
      expect(res.status).toBe(200);

      const resAgain = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json');
      expect(resAgain.status).toBe(404);
    });
  });

  describe('POST /api/v1/auth/token', () => {
    const endPoint = '/api/v1/auth/token';
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

      const check: QueryResult = await db.query(sqlToken, [testObj.user, testObj.device]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a token and return 401 when no authorization header found', async () => {
      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(401);

      const check: QueryResult = await db.query(sqlToken, [testObj.user, testObj.device]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a token and return 401 when no password found', async () => {
      const invalid_password = '';
      const res = await supertest(app)
        .post(endPoint)
        .auth(testObj.user, invalid_password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(401);

      const check: QueryResult = await db.query(sqlToken, [testObj.user, testObj.device]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a token and return 401 when wrong auth scheme detected', async () => {
      const res = await supertest(app)
        .post(endPoint)
        .auth(testObj.user, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(401);

      const check: QueryResult = await db.query(sqlToken, [testObj.user, testObj.device]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a token and return 401 when wrong password detected', async () => {
      const wrongPassword = 'password';
      const res = await supertest(app)
        .post(endPoint)
        .auth(testObj.user, wrongPassword, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(401);

      const check: QueryResult = await db.query(sqlToken, [testObj.user, testObj.device]);
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

      const check: QueryResult = await db.query(sqlToken, [testObj.user, testObj.device]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a token and return 400 when device is not found in req body', async () => {
      const emptyData = {};
      const res = await supertest(app)
        .post(endPoint)
        .auth(testObj.user, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(emptyData);
      expect(res.status).toBe(400);

      const check: QueryResult = await db.query(sqlToken, [testObj.user, testObj.device]);
      expect(check.rowCount).toBe(0);
    });

    it('should create access_token and refresh_token and return 201 with them when correct credentials presented', async () => {
      const res = await supertest(app)
        .post(endPoint)
        .auth(testObj.user, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');

      const hashedToken = await hash.sha256(res.body.refresh_token);
      const check: QueryResult = await db.query(sqlToken, [testObj.user, testObj.device]);
      expect(check.rowCount).toBe(1);
      expect(check.rows[0].token).toBe(hashedToken);
    });

    it('should create access_token and refresh_token and return 201 with them when correct credentials presented repeatedly', async () => {
      const resOld = await supertest(app)
        .post(endPoint)
        .auth(testObj.user, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(data);
      expect(resOld.status).toBe(201);
      const hashedTokenOld = await hash.sha256(resOld.body.refresh_token);

      const resNew = await supertest(app)
        .post(endPoint)
        .auth(testObj.user, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(data);
      expect(resNew.status).toBe(201);
      const hashedTokenNew = await hash.sha256(resNew.body.refresh_token);

      const check: QueryResult = await db.query(sqlToken, [testObj.user, testObj.device]);
      expect(check.rowCount).toBe(1);
      expect(check.rows[0].token).not.toBe(hashedTokenOld);
      expect(check.rows[0].token).toBe(hashedTokenNew);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    const endPoint = '/api/v1/auth/refresh';
    const sqlToken = `SELECT token FROM refresh_token
    WHERE user_id=(SELECT id FROM userpool WHERE email=$1::VARCHAR(50))
    AND device=$2::VARCHAR(50)`;

    it('should failed to create a token and return 401 when no refreshToken found in req body', async () => {
      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send({});

      expect(res.status).toBe(401);
    });

    it('should create access_token and refresh_token and return 201 with them when valid refreshToken presented', async () => {
      const token = await supertest(app)
        .post('/api/v1/auth/token')
        .auth(testObj.user, testObj.password, { type: 'basic' })
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
      const check: QueryResult = await db.query(sqlToken, [testObj.user, testObj.device]);
      expect(check.rowCount).toBe(1);
      expect(check.rows[0].token).toBe(hashedToken);
    });

    it('should delete token in DB when refresh token reuse detected', async () => {
      const tokenOld = await supertest(app)
        .post('/api/v1/auth/token')
        .auth(testObj.user, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send({ device: testObj.device });
      expect(tokenOld.status).toBe(201);
      const oldRefreshToken = tokenOld.body.refresh_token;

      const tokenNew = await supertest(app)
        .post('/api/v1/auth/token')
        .auth(testObj.user, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send({ device: testObj.device });
      expect(tokenNew.status).toBe(201);

      const res = await supertest(app)
        .post(endPoint)
        .set('Accept', 'application/json')
        .send({ refresh_token: oldRefreshToken });

      expect(res.status).toBe(401);

      const check: QueryResult = await db.query(sqlToken, [testObj.user, testObj.device]);
      expect(check.rowCount).toBe(0);
    });
  });
});
