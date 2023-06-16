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

      mockedDbQuery.mockResolvedValue({ rowCount: 0 });

      const result = await provider(userId);

      expect(db.query).toBeCalledTimes(1);
      expect(db.query).toBeCalledWith(expect.any(String), [userId]);
      expect(result).toEqual(null);
    });

    it('should take userId and return user info without credentials', async () => {
      const user_id = 123;
      const role_id = 321;
      const role_name = 'role_name';

      mockedDbQuery
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: user_id, role_id }] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ name: role_name }] });

      const result = await provider(user_id);

      expect(db.query).toBeCalledTimes(2);
      expect(db.query).nthCalledWith(1, expect.any(String), [user_id]);
      expect(db.query).nthCalledWith(2, expect.any(String), [role_id]);
      expect(result).toEqual({ user_id, role_name });
    });
  });
});
