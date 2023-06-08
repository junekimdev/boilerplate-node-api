// In typescript testing, mockings should come before imports
import { EventEmitter } from 'events';
const mockedQueryResult = 'mockedQueryResult';
const mockedClient = {
  query: jest.fn(async (query: string, values?: any[]) => mockedQueryResult),
  release: jest.fn(() => {}),
};
class MockedPool extends EventEmitter {
  query = jest.fn(async (query: string, values?: any[]) => mockedQueryResult);
  connect = jest.fn(async () => mockedClient);
}
jest.mock('pg', () => {
  const pool = new MockedPool();
  jest.spyOn(MockedPool.prototype, 'on');
  return { Pool: jest.fn((config) => pool), PoolClient: mockedClient };
});

const mockedlogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock('../../../src/utils/logger', () => {
  return { logger: mockedlogger };
});

// Imports
import { PoolClient } from 'pg';
import db, { pool } from '../../../src/utils/db';

// Tests
describe('Test /src/util/db', () => {
  describe('Pool', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should have been created', () => {
      expect(pool).toBeInstanceOf(MockedPool);
    });

    it('should start listening "connect" event to log', () => {
      const event = 'connect';
      const emitter = pool.on(event, () => {});
      emitter.emit(event);

      expect(pool.on).toBeCalledWith(event, expect.any(Function));
      expect(mockedlogger.info).toBeCalledWith(expect.any(String));
    });

    it('should start listening "error" event to log', () => {
      const event = 'error';
      const emitter = pool.on(event, () => {});
      emitter.emit(event, new Error('err'));

      expect(pool.on).toBeCalledWith(event, expect.any(Function));
      expect(mockedlogger.error).toBeCalledWith(expect.any(String));
    });
  });

  describe('query()', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should execute a query with parameters', async () => {
      const queryString = 'SELECT * FROM users';
      const mockedParam = ['param1', 'param2'];

      const result = await db.query(queryString, mockedParam);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toBeCalledWith(queryString, mockedParam);
      expect(result).toBe(mockedQueryResult);
    });

    it('should execute a query without parameters', async () => {
      const queryString = 'SELECT * FROM users';

      const result = await db.query(queryString);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query).toBeCalledWith(queryString, undefined);
      expect(result).toBe(mockedQueryResult);
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

      expect(mockedClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(queryFunc).toHaveBeenCalled();
      expect(mockedClient.query).toHaveBeenNthCalledWith(4, 'COMMIT');
      expect(mockedClient.query).not.toHaveBeenCalledWith('ROLLBACK');
      expect(mockedlogger.warn).not.toHaveBeenCalled();
      expect(mockedClient.release).toHaveBeenCalled();
      expect(result).toBe(mockedQueryResult);
    });

    it('should rollback the transaction on error', async () => {
      const queryFunc = jest.fn(async (client: PoolClient) => {
        await client.query('INSERT INTO users (name) VALUES ($1)', ['John']);
        throw new Error('Something went wrong');
      });

      await expect(db.transaction(queryFunc)).rejects.toThrow('Something went wrong');

      expect(mockedClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(queryFunc).toHaveBeenCalled();
      expect(mockedClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
      expect(mockedlogger.warn).toHaveBeenCalled();
      expect(mockedClient.query).not.toHaveBeenCalledWith('COMMIT');
      expect(mockedClient.release).toHaveBeenCalled();
    });
  });
});
