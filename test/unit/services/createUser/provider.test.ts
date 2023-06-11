jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));
jest.mock('../../../../src/utils/hash', () => ({ createSalt: jest.fn(), sha256: jest.fn() }));

import provider from '../../../../src/services/createUser/provider';
import db from '../../../../src/utils/db';
import hash from '../../../../src/utils/hash';

const mockedQuery = db.query as jest.Mock;
const mockedSha256 = hash.sha256 as jest.Mock;
const mockedCreateSalt = hash.createSalt as jest.Mock;

describe('Test /src/service/createUser/provider', () => {
  const userId = 123;
  const email = 'test@example.com ';
  const password = 'password';
  const surname = 'surname';
  const givenName = 'givenName';
  const role = 'user1';
  const salt = 'mockingSalt';
  const hashed = 'hashedPassword';
  const queryResult = { rows: [{ id: userId }] };

  it('should insert a user and return the user ID', async () => {
    mockedQuery.mockResolvedValue(queryResult);
    mockedSha256.mockResolvedValue(hashed);
    mockedCreateSalt.mockReturnValue(salt);

    const result = await provider(email, password, role, undefined, undefined);

    expect(result).toBe(userId);
    expect(hash.createSalt).toBeCalled();
    expect(hash.sha256).toBeCalledWith(password + salt);

    expect(db.query).toBeCalledWith(expect.any(String), [email, hashed, salt, role, '', '']);
  });

  it('should insert a user and return the user ID with additional info', async () => {
    mockedQuery.mockResolvedValue(queryResult);
    mockedSha256.mockResolvedValue(hashed);
    mockedCreateSalt.mockReturnValue(salt);

    const result = await provider(email, password, role, surname, givenName);

    expect(result).toBe(userId);
    expect(hash.createSalt).toBeCalled();
    expect(hash.sha256).toBeCalledWith(password + salt);

    expect(db.query).toBeCalledWith(expect.any(String), [
      email,
      hashed,
      salt,
      role,
      surname,
      givenName,
    ]);
  });
});
