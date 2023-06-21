jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));
jest.mock('../../../../src/utils/hash', () => ({ createSalt: jest.fn(), passSalt: jest.fn() }));

import provider from '../../../../src/services/createUser/provider';
import db from '../../../../src/utils/db';
import { AppError, errDef, NULL_ERR_CODE, UK_ERR_CODE } from '../../../../src/utils/errors';
import hash from '../../../../src/utils/hash';
import { getDbErrorMock } from '../../../testUtil';

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

  it('should throw the error if db throws an error', async () => {
    const expectedError = new Error();

    mockedQuery.mockRejectedValue(expectedError);

    try {
      await provider(email, password, roleName, '', '');
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });

  it('should throw RoleNotFound if the role does not exist', async () => {
    const dbError = getDbErrorMock(NULL_ERR_CODE);
    const expectedError = new AppError(errDef[404].RoleNotFound);

    mockedQuery.mockRejectedValue(dbError);

    try {
      await provider(email, password, roleName, '', '');
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });

  it('should throw UserAlreadyExists if user already exists', async () => {
    const dbError = getDbErrorMock(UK_ERR_CODE);
    const expectedError = new AppError(errDef[409].UserAlreadyExists);

    mockedQuery.mockRejectedValue(dbError);

    try {
      await provider(email, password, roleName, '', '');
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });

  it('should insert a user and return the user ID', async () => {
    const params = [email, hashed, salt, roleName, '', ''];

    mockedCreateSalt.mockReturnValue(salt);
    mockedHashPass.mockReturnValue(hashed);
    mockedQuery.mockResolvedValue({ rowCount: 1, rows: [{ id: userId }] });

    const result = await provider(email, password, roleName, '', '');

    expect(hash.createSalt).toBeCalled();
    expect(hash.passSalt).toBeCalledWith(password, salt);
    expect(db.query).toBeCalledWith(expect.any(String), params);
    expect(result).toBe(userId);
  });

  it('should insert a user and return the user ID with additional info', async () => {
    const params = [email, hashed, salt, roleName, surname, givenName];

    mockedCreateSalt.mockReturnValue(salt);
    mockedHashPass.mockReturnValue(hashed);
    mockedQuery.mockResolvedValue({ rowCount: 1, rows: [{ id: userId }] });

    const result = await provider(email, password, roleName, surname, givenName);

    expect(hash.createSalt).toBeCalled();
    expect(hash.passSalt).toBeCalledWith(password, salt);
    expect(db.query).toBeCalledWith(expect.any(String), params);
    expect(result).toBe(userId);
  });
});
