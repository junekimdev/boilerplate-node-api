// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/readUser/provider';
import db from '../../../../src/utils/db';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/readUser/provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('provider', () => {
    it('should return null when the user does not exist', async () => {
      const userId = 123;
      const queryResult = { rowCount: 0 };

      mockedDbQuery.mockResolvedValue(queryResult);

      const result = await provider(userId);

      expect(db.query).toBeCalledTimes(1);
      expect(db.query).toBeCalledWith(expect.any(String), [userId]);
      expect(result).toEqual(null);
    });

    it('should take userId and return user info without credentials', async () => {
      const userId = 123;
      const userInfo = { id: userId };
      const queryResult = { rowCount: 1, rows: [userInfo] };

      mockedDbQuery.mockResolvedValue(queryResult);

      const result = await provider(userId);

      expect(db.query).toBeCalledTimes(1);
      expect(db.query).toBeCalledWith(expect.any(String), [userId]);
      expect(result).toEqual(userInfo);
    });
  });
});
