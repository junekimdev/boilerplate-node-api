import { Express } from 'express';
import { Server } from 'http';
import { QueryResult } from 'pg';
import supertest from 'supertest';
import hash from '../../utils/hash';
import initTest, { testObj } from '../initTest';

describe('Test /api/v1/auth', () => {
  let app: Express;
  let server: Server;
  let db: any;

  beforeAll(async () => {
    await initTest('test_auth', '3001');
    const mod: any = require('../../server');
    app = mod.default;
    server = mod.server;
    db = require('../../utils/db');
  }, 10000);
  afterAll(async () => {
    await db.pool.end();
    server.close();
  });

  describe('/api/v1/auth/user', () => {
    const endPoint = '/api/v1/auth/user';
    const sqlUser = `SELECT id FROM userpool WHERE email=$1::VARCHAR(50)`;

    it('should fail to create a user and return 400 when invalid email detected', async () => {
      const invalidEmail = 'test_mycompany.com';
      const data = { email: invalidEmail, password: testObj.password };
      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(400);

      const check: QueryResult = await db.query(sqlUser, [invalidEmail]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to create a user return 403 when email already exists', async () => {
      const data = { email: testObj.user, password: testObj.password };
      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(403);

      const check: QueryResult = await db.query(sqlUser, [testObj.user]);
      expect(check.rowCount).toBe(1);
    });

    it('should create a user and return 201 with valid info', async () => {
      const testUser = 'test@mycompany.com';
      const data = { email: testUser, password: testObj.password };
      const res = await supertest(app).post(endPoint).set('Accept', 'application/json').send(data);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user_id');

      const check: QueryResult = await db.query(sqlUser, [testUser]);
      expect(check.rowCount).toBe(1);
    });
  });

  describe('/api/v1/auth/token', () => {
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
});
