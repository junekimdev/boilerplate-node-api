// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/deleteRole/provider';
import db, { FK_ERR_CODE } from '../../../../src/utils/db';
import { AppError, errDef } from './../../../../src/utils/errors';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/deleteRole/provider', () => {
  const roleName = 'roleName';
  const roleId = 123;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 0 when role does not exist', async () => {
    mockedDbQuery.mockResolvedValue({ rowCount: 0 });

    const result = await provider(roleName);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [roleName]);
    expect(result).toBe(0);
  });

  it('should throw RoleHasUsers error when role has users', async () => {
    const dbError: any = new Error('DB FK restrict error');
    dbError.code = FK_ERR_CODE;
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
