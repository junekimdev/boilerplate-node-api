// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/deleteUser/provider';
import db from '../../../../src/utils/db';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/deleteUser/provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const userId = 123;

  describe('provider', () => {
    it('should fail to delete user and return 0 if the user does not exist in DB', async () => {
      mockedDbQuery.mockResolvedValue({ rowCount: 0 });

      const result = await provider(userId);

      expect(db.query).toBeCalledTimes(1);
      expect(db.query).toBeCalledWith(expect.any(String), [userId]);
      expect(result).toBe(0);
    });

    it('should delete user and return userId if successful', async () => {
      const queryResult = { rowCount: 1, rows: [{ id: 1 }] };
      mockedDbQuery.mockResolvedValue(queryResult);

      const result = await provider(userId);

      expect(db.query).toBeCalledTimes(1);
      expect(db.query).toBeCalledWith(expect.any(String), [userId]);
      expect(result).toBe(queryResult.rows[0].id);
    });
  });
});
