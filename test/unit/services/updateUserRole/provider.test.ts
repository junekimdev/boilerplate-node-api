// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/updateUserRole/provider';
import db from '../../../../src/utils/db';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/updateUserRole/provider', () => {
  const email = 'test@company.com';
  const userId = 123;
  const newRole = 'newRole';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 0 when the user does not exist', async () => {
    mockedDbQuery.mockResolvedValue({ rowCount: 0 });

    const result = await provider(userId, newRole);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [userId, newRole]);
    expect(result).toEqual(0);
  });

  it('should take user id and new role and return 1 when updated successfully', async () => {
    mockedDbQuery.mockResolvedValue({ rowCount: 1 });

    const result = await provider(userId, newRole);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [userId, newRole]);
    expect(result).toEqual(1);
  });
});
