// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/readUserPic/provider';
import db from '../../../../src/utils/db';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/readUserPic/provider', () => {
  const userId = 123;
  const profile_url = 'profile_url';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty string when user does not exist', async () => {
    mockedDbQuery.mockResolvedValue({ rowCount: 0 });

    const result = await provider(userId);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [userId]);
    expect(result).toEqual('');
  });

  it('should return profile_url', async () => {
    mockedDbQuery.mockResolvedValue({ rowCount: 1, rows: [{ profile_url }] });

    const result = await provider(userId);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [userId]);
    expect(result).toEqual(profile_url);
  });
});
