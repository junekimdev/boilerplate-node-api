import { Express } from 'express';
import { Server } from 'http';
import { QueryResult } from 'pg';
import supertest from 'supertest';
import hash from '../../src/utils/hash';
import initTest from '../initTest';
import { apiPrefix, createRandomUser, getTester, getToken, testObj } from '../testUtil';

const testName = 'test_auth_admin';
const testPort = '3003';

describe('Test /admin/auth', () => {
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
      { method: 'POST', url: `${apiPrefix}/admin/auth/role` },
      { method: 'PUT', url: `${apiPrefix}/admin/auth/user/role` },
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

    it.each(endpoints)(
      '$method $url should fail when a normal user tries to request',
      async ({ method, url }) => {
        const testUser = await createRandomUser(db);
        const accessToken = await getToken(app, testUser);
        const res = await getTester(app, method, url)
          .auth(accessToken, { type: 'bearer' })
          .set('Accept', 'application/json');
        expect(res.status).toBe(403);
      },
    );
  });

  describe('POST /admin/auth/role', () => {
    const endPoint = apiPrefix + '/admin/auth/role';
    const sqlRole = `SELECT id FROM user_role WHERE name=$1::VARCHAR(20)`;
    const sqlAccess = `SELECT T2.name as res_name, readable, writable
    FROM access_control as T1 LEFT JOIN resource as T2 ON T1.resource_id=T2.id
    WHERE T1.role_id=$1::INT`;

    const permissions = [
      { res_name: 'userpool', readable: true, writable: false },
      { res_name: 'topic', readable: true, writable: false },
      { res_name: 'subscription', readable: true, writable: false },
    ];

    it('should fail to create a role for role_name is not a string', async () => {
      const testUser = await createRandomUser(db, testObj.role.admin);
      const accessToken = await getToken(app, testUser);
      const data = { role_name: 1, permissions };

      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(400);
    });

    const invalidPermissions = [
      { name: 'res1', readable: true, writable: false }, // wrong res_name
      { res_name: 'res1', readable: 1, writable: false }, // wrong readable
      { res_name: 'res1', readable: true, writable: 'false' }, // wrong writable
    ];

    it.each(invalidPermissions)(
      'Test #%# should fail to create a role for permissions are not in right format',
      async (permit) => {
        const testUser = await createRandomUser(db, testObj.role.admin);
        const accessToken = await getToken(app, testUser);
        const role_name = hash.createUUID().substring(0, 10);
        const data = { role_name, permissions: [permit] };

        const res = await supertest(app)
          .post(endPoint)
          .auth(accessToken, { type: 'bearer' })
          .set('Accept', 'application/json')
          .send(data);
        expect(res.status).toBe(400);

        const check = await db.query(sqlRole, [role_name]);
        expect(check.rowCount).toBe(0);
      },
    );

    it('should fail to create a role for role_name already exists', async () => {
      const testUser = await createRandomUser(db, testObj.role.admin);
      const accessToken = await getToken(app, testUser);
      const data = { role_name: testObj.role.user, permissions };

      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(409);
    });

    it('should create a role', async () => {
      const testUser = await createRandomUser(db, testObj.role.admin);
      const accessToken = await getToken(app, testUser);
      const role_name = hash.createUUID().substring(0, 10);
      const data = { role_name, permissions };

      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(201);
      const roleId = res.body.role_id;

      const checkRole = await db.query(sqlRole, [role_name]);
      expect(checkRole.rowCount).toBe(1);
      expect(checkRole.rows[0].id).toBe(roleId);

      const checkAccess = await db.query(sqlAccess, [roleId]);
      expect(checkAccess.rowCount).toBe(permissions.length);
      permissions.forEach((permit, i) => {
        expect(checkAccess.rows[i]).toEqual(permit);
      });
    });
  });

  describe('PUT /admin/auth/user/role', () => {
    const endPoint = apiPrefix + '/admin/auth/user/role';
    const sqlRoleByEmail = `SELECT t2.name
    FROM userpool as t1 LEFT JOIN user_role as t2 ON t1.role_id=t2.id
    WHERE email=$1::VARCHAR(50)`;
    const sqlRoleById = `SELECT t2.name
    FROM userpool as t1 LEFT JOIN user_role as t2 ON t1.role_id=t2.id
    WHERE t1.id=$1::INT`;

    it('should fail to change role of a user when role_name is not presented', async () => {
      const testUser = await createRandomUser(db, testObj.role.admin);
      const accessToken = await getToken(app, testUser);
      const data = { user_id: 1 };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(400);
    });

    it('should fail to change role of a user when role_name is invalid', async () => {
      const testUser = await createRandomUser(db, testObj.role.admin);
      const accessToken = await getToken(app, testUser);
      const data = { user_id: 1, role_name: 'invalid' };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(400);
    });

    it('should fail to change role of a user when user_id is invalid', async () => {
      const testUser = await createRandomUser(db, testObj.role.admin);
      const accessToken = await getToken(app, testUser);
      const data = { user_id: '123', role_name: testObj.role.admin };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(400);
    });

    it('should change role of self when user_id is not presented', async () => {
      const testUser = await createRandomUser(db, testObj.role.admin);
      const accessToken = await getToken(app, testUser);
      const data = { role_name: testObj.role.user };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);

      const check: QueryResult = await db.query(sqlRoleByEmail, [testUser]);
      expect(check.rows[0].name).toBe(testObj.role.user);
    });

    it('should change role of the said user in req', async () => {
      const testUser = await createRandomUser(db, testObj.role.admin);
      const accessToken = await getToken(app, testUser);
      const targetUserId = 2;
      const data = { user_id: targetUserId, role_name: testObj.role.admin };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);

      const check: QueryResult = await db.query(sqlRoleById, [targetUserId]);
      expect(check.rows[0].name).toBe(testObj.role.admin);
    });
  });
});
