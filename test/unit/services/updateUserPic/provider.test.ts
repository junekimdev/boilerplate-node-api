// Mocks
const client = { query: jest.fn() };
jest.mock('../../../../src/utils/db', () => ({ transaction: jest.fn((f) => f(client)) }));
jest.mock('fs', () => ({ promises: { rm: jest.fn(() => {}) } }));

// Imports
import fs from 'fs';
import provider from '../../../../src/services/updateUserPic/provider';
import db from '../../../../src/utils/db';

// Tests
describe('Test /src/services/updateUserPic/provider', () => {
  const userId = 123;
  const profile_url = 'profile_url';
  const newPicURL = 'newPicURL';

  client.query.mockResolvedValue({ rowCount: 1, rows: [{ profile_url, id: userId }] });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 0 when user does not exist', async () => {
    client.query.mockResolvedValueOnce({ rowCount: 0 });

    const result = await provider(userId, newPicURL);

    expect(db.transaction).toBeCalledTimes(1);
    expect(client.query).toBeCalledTimes(1);
    expect(client.query).toBeCalledWith(expect.any(String), [userId]);
    expect(result).toEqual(0);
  });

  it('should not do deletion when DB returns null for profile_url', async () => {
    client.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ profile_url: null }] });

    await provider(userId, newPicURL);

    expect(fs.promises.rm).not.toBeCalled();
  });

  it('should delete old picture and return user id when DB returns profile_url', async () => {
    const result = await provider(userId, newPicURL);

    expect(db.transaction).toBeCalledTimes(1);
    expect(client.query).toBeCalledTimes(2);
    expect(client.query).nthCalledWith(1, expect.any(String), [userId]);
    expect(client.query).nthCalledWith(2, expect.any(String), [userId, newPicURL]);
    expect(fs.promises.rm).toBeCalledWith(profile_url);
    expect(result).toEqual(userId);
  });
});
