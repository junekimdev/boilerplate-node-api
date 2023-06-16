import { Express } from 'express';
import { Server } from 'http';
import { QueryResult } from 'pg';
import supertest from 'supertest';
import { SQL_INSERT_PERMIT, SQL_INSERT_ROLE } from '../../src/services/createRole/provider';
import hash from '../../src/utils/hash';
import initTest from '../initTest';
import {
  apiPrefix,
  createRandomRole,
  createRandomUser,
  getTester,
  getToken,
  testObj,
} from '../testUtil';

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
      { method: 'GET', url: `${apiPrefix}/admin/auth/role` },
      { method: 'PUT', url: `${apiPrefix}/admin/auth/role` },
      { method: 'DELETE', url: `${apiPrefix}/admin/auth/role` },
      { method: 'PUT', url: `${apiPrefix}/admin/auth/user/role` },
      { method: 'GET', url: `${apiPrefix}/admin/auth/group/role` },
      { method: 'PUT', url: `${apiPrefix}/admin/auth/group/role` },
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
        const accessToken = await getToken(app, testObj.user);
        const res = await getTester(app, method, url)
          .auth(accessToken, { type: 'bearer' })
          .set('Accept', 'application/json');
        expect(res.status).toBe(403);
      },
    );
  });

  describe('POST /admin/auth/role', () => {
    const endPoint = apiPrefix + '/admin/auth/role';
    const sqlRole = `SELECT id FROM user_role WHERE name=$1::VARCHAR(50);`;
    const sqlAccess = `SELECT T2.name as res_name, readable, writable
    FROM access_control as T1 LEFT JOIN resource as T2 ON T1.resource_id=T2.id
    WHERE T1.role_id=$1::INT;`;

    const permissions = [
      { res_name: 'userpool', readable: true, writable: false },
      { res_name: 'topic', readable: true, writable: false },
      { res_name: 'subscription', readable: true, writable: false },
    ];

    it('should fail to create a role for role_name already exists', async () => {
      const accessToken = await getToken(app, testObj.admin);
      const data = { role_name: testObj.role.user, permissions };

      const res = await supertest(app)
        .post(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(409);
    });

    it('should create a role', async () => {
      const accessToken = await getToken(app, testObj.admin);
      const role_name = hash.createUUID();
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

  describe('GET /admin/auth/role', () => {
    const endPoint = apiPrefix + '/admin/auth/role';
    const sqlAccessByName = `SELECT T3.name as res_name, readable, writable
    FROM access_control as T1
    LEFT JOIN user_role as T2 ON T1.role_id=T2.id
    LEFT JOIN resource as T3 ON T1.resource_id=T3.id
    WHERE T2.name=$1::VARCHAR(50);`;

    const permissions = [
      { res_name: 'userpool', readable: true, writable: false },
      { res_name: 'topic', readable: true, writable: false },
      { res_name: 'subscription', readable: true, writable: false },
    ];

    it('should read a role', async () => {
      const testRole = await createRandomRole(db);
      const accessToken = await getToken(app, testObj.admin);
      const data = { role_name: testRole };

      const res = await supertest(app)
        .get(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('role_id');
      expect(res.body).toHaveProperty('role_name');
      expect(res.body).toHaveProperty('permissions');
      expect(res.body).toHaveProperty('created_at');
      expect(res.body.permissions).toHaveLength(testObj.permissions.length);
      testObj.permissions.forEach((permit, i) => {
        expect(res.body.permissions[i]).toEqual(permit);
      });

      const checkAccess = await db.query(sqlAccessByName, [testRole]);
      expect(checkAccess.rowCount).toBe(testObj.permissions.length);
      testObj.permissions.forEach((permit, i) => {
        expect(checkAccess.rows[i]).toEqual(permit);
      });
    });
  });

  describe('PUT /admin/auth/role', () => {
    const endPoint = apiPrefix + '/admin/auth/role';
    const sqlRoleByName = 'SELECT id FROM user_role WHERE name=$1::VARCHAR(50);';
    const sqlAccessByName = `SELECT T3.name as res_name, readable, writable
    FROM access_control as T1
    LEFT JOIN user_role as T2 ON T1.role_id=T2.id
    LEFT JOIN resource as T3 ON T1.resource_id=T3.id
    WHERE T2.name=$1::VARCHAR(50);`;
    const sqlTokenById = `SELECT token
    FROM userpool as T1 LEFT JOIN refresh_token as T2 ON T1.id=T2.user_id
    WHERE role_id=$1::INT;`;

    const permissions = [
      { res_name: 'userpool', readable: false, writable: true },
      { res_name: 'topic', readable: false, writable: true },
    ];

    it('should fail to update a role when role_name already exists', async () => {
      const testRole = await createRandomRole(db);
      const newName = testObj.role.user;
      const accessToken = await getToken(app, testObj.admin);
      const data = { role_name: testRole, update_data: { role_name: newName, permissions } };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(409);
    });

    it('should update a role', async () => {
      const testRole = await createRandomRole(db);
      const newName = 'new-test-role';
      const accessToken = await getToken(app, testObj.admin);
      const data = { role_name: testRole, update_data: { role_name: newName, permissions } };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('role_id');
      const roleId = res.body.role_id;

      const checkRoleOld = await db.query(sqlRoleByName, [testRole]);
      expect(checkRoleOld.rowCount).toBe(0);
      const checkRoleNew = await db.query(sqlRoleByName, [newName]);
      expect(checkRoleNew.rowCount).toBe(1);
      const checkAccess = await db.query(sqlAccessByName, [newName]);
      expect(checkAccess.rowCount).toBe(permissions.length);
      permissions.forEach((permit, i) => {
        expect(checkAccess.rows[i]).toEqual(permit);
      });
      const checkTokens = await db.query(sqlTokenById, [roleId]);
      expect(checkTokens.rowCount).toBe(0);
    });
  });

  describe('DELETE /admin/auth/role', () => {
    const endPoint = apiPrefix + '/admin/auth/role';
    const sqlRoleByName = 'SELECT id FROM user_role WHERE name=$1::VARCHAR(50);';

    it('should fail to delete a role and return 403 when the role has users', async () => {
      const accessToken = await getToken(app, testObj.admin);
      const data = { role_name: testObj.role.user };

      const res = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(403);

      const check = await db.query(sqlRoleByName, [testObj.role.user]);
      expect(check.rowCount).toBe(1);
    });

    it('should return 404 when the role does not exist', async () => {
      const testRole = await createRandomRole(db);
      const accessToken = await getToken(app, testObj.admin);
      const data = { role_name: testRole };

      const first = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(first.status).toBe(200);

      const res = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(404);
    });

    it('should delete a role and return 200', async () => {
      const testRole = await createRandomRole(db);
      const accessToken = await getToken(app, testObj.admin);
      const data = { role_name: testRole };

      const res = await supertest(app)
        .delete(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('role_id');
      const roleId = res.body.role_id;

      const check = await db.query(sqlRoleByName, [testRole]);
      expect(check.rowCount).toBe(0);
    });
  });

  describe('PUT /admin/auth/user/role', () => {
    const endPoint = apiPrefix + '/admin/auth/user/role';
    const sqlRoleByEmail = `SELECT t2.name
    FROM userpool as t1 LEFT JOIN user_role as t2 ON t1.role_id=t2.id
    WHERE email=$1::VARCHAR(50);`;
    const sqlRoleById = `SELECT t2.name
    FROM userpool as t1 LEFT JOIN user_role as t2 ON t1.role_id=t2.id
    WHERE t1.id=$1::INT;`;

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
      const accessToken = await getToken(app, testObj.admin);
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

  describe('GET /admin/auth/group/role', () => {
    const endPoint = apiPrefix + '/admin/auth/group/role';
    const sqlUserByRoleName = `SELECT T1.id
    FROM userpool as T1 LEFT JOIN user_role as T2 ON T1.role_id=T2.id
    WHERE T2.name=$1::VARCHAR(50);`;

    it('should return 404 when the role does not exist', async () => {
      const invalidRole = 'invalidRole';
      const accessToken = await getToken(app, testObj.admin);
      const data = { role_name: invalidRole };

      const res = await supertest(app)
        .get(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(404);
    });

    it('should return 200 with an empty array when no user is in the role', async () => {
      const testRole = await createRandomRole(db);
      const accessToken = await getToken(app, testObj.admin);
      const data = { role_name: testRole };

      const res = await supertest(app)
        .get(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user_ids');
      expect(Array.isArray(res.body.user_ids)).toBeTruthy();
      expect(res.body.user_ids).toHaveLength(0);
    });

    it('should get all ids of user in a role', async () => {
      const testRole = await createRandomRole(db);
      for (let i = 0; i < 10; i++) await createRandomUser(db, testRole);
      const accessToken = await getToken(app, testObj.admin);
      const data = { role_name: testRole };

      const res = await supertest(app)
        .get(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user_ids');
      expect(Array.isArray(res.body.user_ids)).toBeTruthy();
      expect(res.body.user_ids).toHaveLength(10);

      const check = await db.query(sqlUserByRoleName, [testRole]);
      expect(check.rowCount).toBe(10);
    });
  });

  describe('PUT /admin/auth/group/role', () => {
    const endPoint = apiPrefix + '/admin/auth/group/role';
    const sqlUserByRoleName = `SELECT T1.id
    FROM userpool as T1 LEFT JOIN user_role as T2 ON T1.role_id=T2.id
    WHERE T2.name=$1::VARCHAR(50);`;

    it('should return 404 when the role does not exist', async () => {
      const invalidRole = 'invalidRole';
      const accessToken = await getToken(app, testObj.admin);
      const data = { role_name: invalidRole, user_ids: [1, 2, 3] };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(404);
    });

    it('should fail to update and return 404 when any one of users does not exist', async () => {
      const ids = await db.query(sqlUserByRoleName, [testObj.role.user]);
      const user_ids: number[] = [];
      ids.rows.map((row: any) => user_ids.push(row.id));
      user_ids.push(9999);
      const accessToken = await getToken(app, testObj.admin);
      const data = { role_name: testObj.role.admin, user_ids };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(404);

      const check = await db.query(sqlUserByRoleName, [testObj.role.user]);
      expect(check.rowCount).toBe(ids.rowCount);
    });

    it('should update the role of a group of users', async () => {
      const testRole = await createRandomRole(db);
      for (let i = 0; i < 10; i++) await createRandomUser(db, testRole);
      const ids = await db.query(sqlUserByRoleName, [testRole]);
      const user_ids: number[] = [];
      ids.rows.map((row: any) => user_ids.push(row.id));
      const accessToken = await getToken(app, testObj.admin);
      const data = { role_name: testObj.role.user, user_ids };

      const res = await supertest(app)
        .put(endPoint)
        .auth(accessToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send(data);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('updated');
      expect(res.body.updated).toBe(10);

      const check = await db.query(sqlUserByRoleName, [testRole]);
      expect(check.rowCount).toBe(0);
    });
  });
});
