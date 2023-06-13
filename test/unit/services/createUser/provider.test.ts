jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));
jest.mock('../../../../src/utils/hash', () => ({ createSalt: jest.fn(), passSalt: jest.fn() }));

import provider from '../../../../src/services/createUser/provider';
import db from '../../../../src/utils/db';
import hash from '../../../../src/utils/hash';

const mockedQuery = db.query as jest.Mock;
const mockedHashPass = hash.passSalt as jest.Mock;
const mockedCreateSalt = hash.createSalt as jest.Mock;

describe('Test /src/service/createUser/provider', () => {
  const userId = 123;
  const email = 'test@example.com ';
  const password = 'password';
  const surname = 'surname';
  const givenName = 'givenName';
  const roleName = 'user1';
  const salt = 'mockingSalt';
  const hashed = 'hashedPassword';
  const queryResult = { rowCount: 1, rows: [{ id: userId }] };

  it('should return 0 if user already exists', async () => {
    mockedCreateSalt.mockReturnValue(salt);
    mockedHashPass.mockResolvedValue(hashed);
    mockedQuery.mockResolvedValue({ rowCount: 0 });

    const result = await provider(email, password, roleName, '', '');

    expect(hash.createSalt).toBeCalled();
    expect(hash.passSalt).toBeCalledWith(password, salt);
    expect(db.query).toBeCalledWith(expect.any(String), [email, hashed, salt, roleName, '', '']);
    expect(result).toBe(0);
  });

  it('should insert a user and return the user ID', async () => {
    mockedCreateSalt.mockReturnValue(salt);
    mockedHashPass.mockResolvedValue(hashed);
    mockedQuery.mockResolvedValue(queryResult);

    const result = await provider(email, password, roleName, '', '');

    expect(hash.createSalt).toBeCalled();
    expect(hash.passSalt).toBeCalledWith(password, salt);
    expect(db.query).toBeCalledWith(expect.any(String), [email, hashed, salt, roleName, '', '']);
    expect(result).toBe(userId);
  });

  it('should insert a user and return the user ID with additional info', async () => {
    mockedCreateSalt.mockReturnValue(salt);
    mockedHashPass.mockResolvedValue(hashed);
    mockedQuery.mockResolvedValue(queryResult);

    const result = await provider(email, password, roleName, surname, givenName);

    expect(hash.createSalt).toBeCalled();
    expect(hash.passSalt).toBeCalledWith(password, salt);
    expect(db.query).toBeCalledWith(expect.any(String), [
      email,
      hashed,
      salt,
      roleName,
      surname,
      givenName,
    ]);
    expect(result).toBe(userId);
  });
});
