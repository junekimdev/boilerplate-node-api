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

const getSubscription = () => ({
  endpoint: 'endpoint',
  keys: { auth: hash.createUUID(), p256dh: 'p256dh' },
});

describe('Test /api/v1/push', () => {
  let app: Express;
  let server: Server;
  let db: any;

  beforeAll(async () => {
    await initTest('test_push', '3002');
    const mod: any = require('../../src/server');
    app = mod.default;
    server = mod.server;
    db = require('../../src/utils/db');
  }, 10000);
  afterAll(async () => {
    await db.pool.end();
    server.close();
  });

  describe('GET /api/v1/push/key', () => {
    const endPoint = '/api/v1/push/key';

    it('should read the vapid public key and return 200 with it', async () => {
      const accessToken = await getToken(app, testObj.user);

      const res = await supertest(app)
        .get(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.key).toBe(process.env.VAPID_PUB_KEY);
    });
  });

  describe('POST /api/v1/push/register', () => {
    const endPoint = '/api/v1/push/register';
    const sqlPushSub = `SELECT id FROM subscription WHERE sub=$1::TEXT;`;

    it('should fail to register subscription and return 400 when invalid subscription is sent', async () => {
      const accessToken = await getToken(app, testObj.user);
      const invalidSub = { keys: { auth: 'auth', p256dh: 'p256dh' } };
      const data = { topic: testObj.pushTopic, subscription: invalidSub };

      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(400);
    });

    it('should fail to register subscription and return 400 when invalid topic is sent', async () => {
      const accessToken = await getToken(app, testObj.user);
      const subscription = getSubscription();
      const invalidTopic = 0;
      const data = { topic: invalidTopic, subscription };

      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(400);

      const check: QueryResult = await db.query(sqlPushSub, [JSON.stringify(subscription)]);
      expect(check.rowCount).toBe(0);
    });

    it('should fail to register subscription and return 400 when unregistered topic is sent', async () => {
      const accessToken = await getToken(app, testObj.user);
      const subscription = getSubscription();
      const unregisteredTopic = 'unregistered-topic';
      const data = { topic: unregisteredTopic, subscription };

      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(400);

      const check: QueryResult = await db.query(sqlPushSub, [JSON.stringify(subscription)]);
      expect(check.rowCount).toBe(0);
    });

    it('should register subscription and return 200 when valid topic and subscription is sent', async () => {
      const accessToken = await getToken(app, testObj.user);
      const subscription = getSubscription();
      const data = { topic: testObj.pushTopic, subscription };

      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);

      const check: QueryResult = await db.query(sqlPushSub, [JSON.stringify(subscription)]);
      expect(check.rowCount).toBe(1);
    });
  });

  describe('POST /api/v1/push/send', () => {
    const endPoint = '/api/v1/push/send';

    it('should failed to send subscriptions and return 403 when non-admin user tries to send', async () => {
      const accessToken = await getToken(app, testObj.user);
      const payload = { message: 'Hello, world!' };
      const data = { topic: testObj.pushTopic, payload };
      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(403);
    });

    it('should failed to send subscriptions and return 400 when invalid topic is sent', async () => {
      const accessToken = await getToken(app, testObj.admin);
      const invalidTopic = 0;
      const payload = { message: 'Hello, world!' };
      const data = { topic: invalidTopic, payload };
      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(400);
    });

    it('should failed to send subscriptions and return 400 when no payload is sent', async () => {
      const accessToken = await getToken(app, testObj.admin);
      const data = { topic: testObj.pushTopic };
      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(400);
    });

    it('should failed to send subscriptions and return 400 when unregistered topic is sent', async () => {
      const accessToken = await getToken(app, testObj.admin);
      const unregisteredTopic = 'unregistered-topic';
      const payload = { message: 'Hello, world!' };
      const data = { topic: unregisteredTopic, payload };
      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(400);
    });

    it('should send subscriptions', async () => {
      const accessToken = await getToken(app, testObj.admin);
      const subscription = getSubscription();
      const regiData = { topic: testObj.pushTopic, subscription };

      // Register subscription
      const registration = await supertest(app)
        .post('/api/v1/push/register')
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(regiData);
      expect(registration.status).toBe(200);

      // Send notification
      const payload = { message: 'Hello, world!' };
      const data = { topic: testObj.pushTopic, payload };
      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(500); // subscriptions are not real sub; so, returns 500
    });
  });
});
