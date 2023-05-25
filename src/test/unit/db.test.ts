const mockedQueryResult = 'mockedQueryResult';
const mockedClient = {
  query: jest.fn(async (query: string, values?: any[]) => mockedQueryResult),
  release: jest.fn(),
};
const mockedPool = {
  query: jest.fn(async (query: string, values?: any[]) => mockedQueryResult),
  connect: jest.fn(async () => mockedClient),
};
jest.mock('pg', () => {
  return { Pool: jest.fn((config) => mockedPool), PoolClient: mockedClient };
});

import { Pool, PoolClient } from 'pg';
import db from '../../utils/db';

describe('Test /src/util/db', () => {
  describe('query()', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should execute a query with parameters', async () => {
      const queryString = 'SELECT * FROM users';
      const mockedParam = ['param1', 'param2'];

      const result = await db.query(queryString, mockedParam);

      expect(mockedPool.query).toHaveBeenCalledTimes(1);
      expect(mockedPool.query).toBeCalledWith(queryString, mockedParam);
      expect(result).toBe(mockedQueryResult);
    });

    it('should execute a query without parameters', async () => {
      const queryString = 'SELECT * FROM users';

      const result = await db.query(queryString);

      expect(mockedPool.query).toHaveBeenCalledTimes(1);
      expect(mockedPool.query).toBeCalledWith(queryString, undefined);
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
      expect(mockedClient.query).not.toHaveBeenCalledWith('COMMIT');
      expect(mockedClient.release).toHaveBeenCalled();
    });
  });
});
