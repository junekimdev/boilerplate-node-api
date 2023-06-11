// In typescript testing, mockings should come before imports
import { EventEmitter } from 'events';
const queryResult = 'mockedQueryResult';
const client = {
  query: jest.fn(() => queryResult),
  release: jest.fn(() => {}),
};
class Pool extends EventEmitter {
  query = jest.fn(() => queryResult);
  connect = jest.fn(() => client);
}
jest.mock('pg', () => {
  const pool = new Pool();
  jest.spyOn(Pool.prototype, 'on');
  return { Pool: jest.fn(() => pool) };
});

jest.mock('../../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Imports
import { PoolClient } from 'pg';
import db, { pool } from '../../../src/utils/db';
import { logger } from '../../../src/utils/logger';

// Tests
describe('Test /src/util/db', () => {
  describe('Pool', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should have been created', () => {
      expect(pool).toBeInstanceOf(Pool);
    });

    it('should start listening "connect" event to log', () => {
      const event = 'connect';
      const emitter = pool.on(event, () => {});
      emitter.emit(event);

      expect(pool.on).toBeCalledWith(event, expect.any(Function));
      expect(logger.info).toBeCalledWith(expect.any(String));
    });

    it('should start listening "error" event to log', () => {
      const event = 'error';
      const emitter = pool.on(event, () => {});
      emitter.emit(event, new Error('err'));

      expect(pool.on).toBeCalledWith(event, expect.any(Function));
      expect(logger.error).toBeCalledWith(expect.any(String));
    });
  });

  describe('query()', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should execute a query with parameters', async () => {
      const queryString = 'SELECT * FROM users';
      const params = ['param1', 'param2'];

      const result = await db.query(queryString, params);

      expect(pool.query).toBeCalledTimes(1);
      expect(pool.query).toBeCalledWith(queryString, params);
      expect(result).toBe(queryResult);
    });

    it('should execute a query without parameters', async () => {
      const queryString = 'SELECT * FROM users';

      const result = await db.query(queryString);

      expect(pool.query).toBeCalledTimes(1);
      expect(pool.query).toBeCalledWith(queryString, undefined);
      expect(result).toBe(queryResult);
    });
  });

  describe('transaction()', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should execute a transaction', async () => {
      const queryFunc = jest.fn(async (client: PoolClient) => {
        await client.query('INSERT INTO users (name) VALUES ($1)', ['John']);
        return await client.query('UPDATE users SET age = $1 WHERE name = $2', [30, 'John']);
      });

      const result = await db.transaction(queryFunc);

      expect(client.query).nthCalledWith(1, 'BEGIN');
      expect(queryFunc).toBeCalled();
      expect(client.query).nthCalledWith(4, 'COMMIT');
      expect(client.query).not.toBeCalledWith('ROLLBACK');
      expect(logger.warn).not.toBeCalled();
      expect(client.release).toBeCalled();
      expect(result).toBe(queryResult);
    });

    it('should rollback the transaction on error', async () => {
      const expectError = new Error('Something went wrong');
      const queryFunc = jest.fn(async (client: PoolClient) => {
        await client.query('INSERT INTO users (name) VALUES ($1)', ['John']);
        throw expectError;
      });

      await expect(db.transaction(queryFunc)).rejects.toThrow('Something went wrong');

      expect(client.query).nthCalledWith(1, 'BEGIN');
      expect(queryFunc).toBeCalled();
      expect(client.query).nthCalledWith(3, 'ROLLBACK');
      expect(logger.warn).toBeCalled();
      expect(client.query).not.toBeCalledWith('COMMIT');
      expect(client.release).toBeCalledWith(expectError);
    });
  });
});
