// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));
jest.mock('../../../../src/utils/hash', () => ({ createSalt: jest.fn(), passSalt: jest.fn() }));

// Imports
import provider from '../../../../src/services/updateUserPwd/provider';
import db from '../../../../src/utils/db';
import hash from '../../../../src/utils/hash';

const mockedHashPass = hash.passSalt as jest.Mock;
const mockedSalt = hash.createSalt as jest.Mock;
const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/updateUserPwd/provider', () => {
  const userId = 123;
  const password = 'test-password';
  const hashed = 'hashedPassword';
  const salt = 'test-salt';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should hash the password and create new salt', async () => {
    mockedHashPass.mockResolvedValue(hashed);
    mockedSalt.mockReturnValue(salt);
    mockedDbQuery.mockResolvedValue({ rowCount: 1, rows: [{ id: userId }] });

    await provider(userId, password);

    expect(hash.passSalt).toBeCalledWith(password, salt);
    expect(hash.createSalt).toBeCalled();
  });

  it('should return 0 if user does not exist in DB', async () => {
    mockedHashPass.mockResolvedValue(hashed);
    mockedSalt.mockReturnValue(salt);
    mockedDbQuery.mockResolvedValue({ rowCount: 0 });

    const result = await provider(userId, password);
    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [userId, hashed, salt]);
    expect(result).toBe(0);
  });

  it('should return 1 when update is done successfully', async () => {
    mockedHashPass.mockResolvedValue(hashed);
    mockedSalt.mockReturnValue(salt);
    mockedDbQuery.mockResolvedValue({ rowCount: 1, rows: [{ id: userId }] });

    const result = await provider(userId, password);
    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [userId, hashed, salt]);
    expect(result).toBe(1);
  });
});
