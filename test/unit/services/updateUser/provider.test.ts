// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/updateUser/provider';
import db from '../../../../src/utils/db';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/updateUser/provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('provider', () => {
    it('should return 0 when the user does not exist', async () => {
      const info = { id: 123 };

      mockedDbQuery.mockResolvedValue({ rowCount: 0 });

      const result = await provider(info);

      expect(db.query).toBeCalledTimes(1);
      expect(db.query).toBeCalledWith(expect.any(String), [info.id]);
      expect(result).toEqual(0);
    });

    it('should take user info and return 1 when updated successfully', async () => {
      const userId = 123;
      const oldInfo = { id: userId, surname: 'surname', given_name: 'given_name' };
      const newInfo = { id: userId, surname: 'new_surname', given_name: 'new_given_name' };

      mockedDbQuery.mockResolvedValueOnce({ rowCount: 1, rows: [oldInfo] });
      mockedDbQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await provider(newInfo);

      expect(db.query).toBeCalledTimes(2);
      expect(db.query).nthCalledWith(1, expect.any(String), [userId]);
      expect(db.query).nthCalledWith(2, expect.any(String), [
        userId,
        newInfo.surname,
        newInfo.given_name,
      ]);
      expect(result).toEqual(1);
    });

    it('should return 1 even if no new info is given', async () => {
      const userId = 123;
      const oldInfo = { id: userId, surname: 'surname', given_name: 'given_name' };
      const newInfo = { id: userId, surname: undefined, given_name: undefined };

      mockedDbQuery.mockResolvedValueOnce({ rowCount: 1, rows: [oldInfo] });
      mockedDbQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await provider(newInfo);

      expect(db.query).toBeCalledTimes(2);
      expect(db.query).nthCalledWith(1, expect.any(String), [userId]);
      expect(db.query).nthCalledWith(2, expect.any(String), [
        userId,
        oldInfo.surname,
        oldInfo.given_name,
      ]);
      expect(result).toEqual(1);
    });
  });
});
