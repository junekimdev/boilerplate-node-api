// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/updateUserRole/provider';
import db from '../../../../src/utils/db';
import { AppError, errDef, NULL_ERR_CODE } from '../../../../src/utils/errors';
import { getDbErrorMock } from '../../../testUtil';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/updateUserRole/provider', () => {
  const userId = 123;
  const newRole = 'newRole';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserNotFound error when the user does not exist', async () => {
    const expectedError = new AppError(errDef[404].UserNotFound);

    mockedDbQuery.mockResolvedValue({ rowCount: 0 });

    try {
      await provider(userId, newRole);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });

  it('should throw RoleNotFound when the role does not exist', async () => {
    const dbError = getDbErrorMock(NULL_ERR_CODE);
    const expectedError = new AppError(errDef[404].RoleNotFound);

    mockedDbQuery.mockRejectedValue(dbError);

    try {
      await provider(userId, newRole);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });

  it('should take user id and new role and return true when updated successfully', async () => {
    mockedDbQuery.mockResolvedValue({ rowCount: 1, rows: [{ id: userId }] });

    const result = await provider(userId, newRole);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [userId, newRole]);
    expect(result).toEqual(userId);
  });
});
