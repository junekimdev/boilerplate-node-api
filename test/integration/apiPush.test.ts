import { Express } from 'express';
import { Server } from 'http';
import { QueryResult } from 'pg';
import supertest from 'supertest';
import { SQL_INSERT_TOPIC } from '../../src/services/createPushTopic/provider';
import hash from '../../src/utils/hash';
import initTest from '../initTest';
import { apiPrefix, getRandomPort, getTester, getToken, testObj } from '../testUtil';

const createRandomTopic = async (db: any) => {
  const name = hash.createUUID();
  await db.query(SQL_INSERT_TOPIC, [name]);
  return name;
};

const getSubscription = () => ({
  endpoint: 'endpoint',
  keys: { auth: hash.createUUID(), p256dh: 'p256dh' },
});

describe('Test /push', () => {
  let app: Express;
  let server: Server;
  let db: any;

  beforeAll(async () => {
    await initTest('test_push', getRandomPort());
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
      { method: 'POST', url: `${apiPrefix}/admin/push/send` },
      { method: 'POST', url: `${apiPrefix}/admin/push/topic` },
      { method: 'GET', url: `${apiPrefix}/admin/push/topic` },
      { method: 'PUT', url: `${apiPrefix}/admin/push/topic` },
      { method: 'DELETE', url: `${apiPrefix}/admin/push/topic` },
    ];

    it.each(endpoints)(
      '$method $url should fail when a normal user tries to request',
      async ({ method, url }) => {
        const accessToken = await getToken(app, testObj.user);
        const res = await getTester(app, method, url)
          .auth(accessToken, { type: 'bearer' })
          .set('Accept', 'application/json');
        expect(res.status).toBe(403);
      },
    );

    it.each(endpoints)(
      '$method $url should fail when invalid topic_name is not a string',
      async ({ method, url }) => {
        const accessToken = await getToken(app, testObj.admin);
        const topic_name = 123;
        const data = { topic_name };
        const res = await getTester(app, method, url)
          .auth(accessToken, { type: 'bearer' })
          .set('Accept', 'application/json')
          .send(data);
        expect(res.status).toBe(400);
      },
    );
  });

  describe('GET /push/key', () => {
    const endPoint = apiPrefix + '/push/key';

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

  describe('POST /push/register', () => {
    const endPoint = apiPrefix + '/push/register';
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

    it('should fail to register subscription and return 400 when topic does not exist', async () => {
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

    it('should register subscription and return 200', async () => {
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

  describe('POST /admin/push/send', () => {
    const endPoint = apiPrefix + '/admin/push/send';

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
        .post(apiPrefix + '/push/register')
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

  describe('POST /admin/push/topic', () => {
    const endPoint = apiPrefix + '/admin/push/topic';
    const sqlTopic = 'SELECT * FROM topic WHERE name=$1::VARCHAR(50);';

    it('should return 409 when the topic already exists', async () => {
      const accessToken = await getToken(app, testObj.admin);
      const data = { topic_name: testObj.pushTopic };

      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(409);
    });

    it('should create a topic and return 201', async () => {
      const accessToken = await getToken(app, testObj.admin);
      const topic_name = 'test-topic-name';
      const data = { topic_name };

      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(201);

      const check = await db.query(sqlTopic, [topic_name]);
      expect(check.rowCount).toBe(1);
    });
  });

  describe('GET /admin/push/topic', () => {
    const endPoint = apiPrefix + '/admin/push/topic';
    const sqlTopic = 'SELECT * FROM topic WHERE name=$1::VARCHAR(50);';

    it('should return 404 when the topic does not exist', async () => {
      const accessToken = await getToken(app, testObj.admin);
      const topic_name = 'invalid-topic';
      const data = { topic_name };

      const res = await supertest(app)
        .get(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(404);
    });

    it('should get topic info and return 200', async () => {
      const testTopic = await createRandomTopic(db);
      const accessToken = await getToken(app, testObj.admin);
      const data = { topic_name: testTopic };

      const res = await supertest(app)
        .get(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('topic_id');
      expect(res.body).toHaveProperty('topic_name');
      expect(res.body).toHaveProperty('created_at');

      const check = await db.query(sqlTopic, [testTopic]);
      const { id, name, created_at } = check.rows[0];
      expect(id).toEqual(res.body.topic_id);
      expect(name).toEqual(res.body.topic_name);
      expect(created_at.toISOString()).toEqual(res.body.created_at);
    });
  });

  describe('PUT /admin/push/topic', () => {
    const endPoint = apiPrefix + '/admin/push/topic';
    const sqlTopicById = 'SELECT name FROM topic WHERE id=$1::INT;';

    it('should return 404 when the topic to update does not exist', async () => {
      const accessToken = await getToken(app, testObj.admin);
      const topic_name = 'not-registered-topic';
      const data = { topic_name, update_data: { topic_name: 'valid' } };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(404);
    });

    it('should return 409 when the new topic already exists in DB', async () => {
      const testTopic = await createRandomTopic(db);
      const accessToken = await getToken(app, testObj.admin);
      const data = { topic_name: testTopic, update_data: { topic_name: testObj.pushTopic } };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(409);
    });

    it('should update topic name and return 200 with topic id', async () => {
      const testTopic = await createRandomTopic(db);
      const accessToken = await getToken(app, testObj.admin);
      const topic_name = 'new-test-topic';
      const data = { topic_name: testTopic, update_data: { topic_name } };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('topic_id');

      const check = await db.query(sqlTopicById, [res.body.topic_id]);
      expect(check.rows[0].name).toEqual(topic_name);
    });
  });

  describe('DELETE /admin/push/topic', () => {
    const endPoint = apiPrefix + '/admin/push/topic';
    const sqlTopic = 'SELECT id FROM topic WHERE name=$1::VARCHAR(50);';

    it('should return 404 when the topic to update does not exist', async () => {
      const accessToken = await getToken(app, testObj.admin);
      const topic_name = 'not-registered-topic';
      const data = { topic_name };

      const res = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(404);
    });

    it('should update topic name and return 200 with topic id', async () => {
      const testTopic = await createRandomTopic(db);
      const accessToken = await getToken(app, testObj.admin);
      const data = { topic_name: testTopic };

      const res = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('topic_id');

      const check = await db.query(sqlTopic, [testTopic]);
      expect(check.rowCount).toBe(0);
    });
  });
});
