import { Express } from 'express';
import { Server } from 'http';
import { QueryResult } from 'pg';
import supertest from 'supertest';
import hash from '../../src/utils/hash';
import initTest from '../initTest';
import { apiPrefix, createRandomUser, testObj } from '../testUtil';

const testName = 'test_token';
const testPort = '3004';

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

  describe('POST /auth/token', () => {
    const endPoint = apiPrefix + '/auth/token';
    const sqlToken = `SELECT token FROM refresh_token
    WHERE user_id=(SELECT id FROM userpool WHERE email=$1::VARCHAR(50))
    AND device=$2::VARCHAR(50)`;
    const data = { device: testObj.device };

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

    it('should fail to create a token and return 400 when device is not found in req.body', async () => {
      const testUser = await createRandomUser(db);
      const noDevice = {};

      const res = await supertest(app)
        .post(endPoint)
        .auth(testUser, testObj.password, { type: 'basic' })
        .set('Accept', 'application/json')
        .send(noDevice);
      expect(res.status).toBe(400);

      const check: QueryResult = await db.query(sqlToken, [testUser, testObj.device]);
      expect(check.rowCount).toBe(0);
    });

    it('should create access_token and refresh_token and return them with 201', async () => {
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

    it('should be able to repeat to create access_token and refresh_token and return them with 201', async () => {
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
