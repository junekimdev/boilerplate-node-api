// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/deleteRole/provider';
import { getDbErrorMock } from '../../../testUtil';
import db from './../../../../src/utils/db';
import { AppError, errDef, FK_ERR_CODE } from './../../../../src/utils/errors';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/deleteRole/provider', () => {
  const roleName = 'roleName';
  const roleId = 123;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw the error if db throws an error', async () => {
    const expectedError = new Error();

    mockedDbQuery.mockRejectedValue(expectedError);

    try {
      await provider(roleName);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });

  it('should return 0 when role does not exist', async () => {
    mockedDbQuery.mockResolvedValue({ rowCount: 0 });

    const result = await provider(roleName);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [roleName]);
    expect(result).toBe(0);
  });

  it('should throw RoleHasUsers error when role has users', async () => {
    const dbError = getDbErrorMock(FK_ERR_CODE);
    const expectedError = new AppError(errDef[403].RoleHasUsers);

    mockedDbQuery.mockRejectedValue(dbError);

    try {
      await provider(roleName);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [roleName]);
  });

  it('should return role_id when deleted successfully', async () => {
    mockedDbQuery.mockResolvedValue({ rowCount: 1, rows: [{ id: roleId }] });

    const result = await provider(roleName);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [roleName]);
    expect(result).toBe(roleId);
  });
});
