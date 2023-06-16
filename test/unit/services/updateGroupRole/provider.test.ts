// Mocks
const client = { query: jest.fn() };
jest.mock('../../../../src/utils/db', () => ({ transaction: jest.fn((f) => f(client)) }));

// Imports
import provider from '../../../../src/services/updateGroupRole/provider';
import db from '../../../../src/utils/db';
import { AppError, errDef } from '../../../../src/utils/errors';

// Tests
describe('Test /src/services/updateGroupRole/provider', () => {
  const roleName = 'test-role';
  const roleId = 123;
  const userIds = [1, 2, 3];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw RoleNotFound when the role does not exist', async () => {
    const expectedError = new AppError(errDef[404].RoleNotFound);

    client.query.mockResolvedValue({ rowCount: 0 });

    try {
      await provider(userIds, roleName);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });

  it('should throw UserNotFound if any of the user in the role does not exist', async () => {
    const expectedError = new AppError(errDef[404].UserNotFound);

    client.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: roleId }] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 0 });

    try {
      await provider(userIds, roleName);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }

    expect(client.query).toBeCalledTimes(3);
  });

  it('should return length of id array when all updates are successful', async () => {
    client.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: roleId }] })
      .mockResolvedValue({ rowCount: 1 });

    const result = await provider(userIds, roleName);

    expect(db.transaction).toBeCalledTimes(1);
    expect(client.query).toBeCalledTimes(1 + userIds.length);
    expect(client.query).nthCalledWith(1, expect.any(String), [roleName]);
    userIds.forEach((id, i) =>
      expect(client.query).nthCalledWith(2 + i, expect.any(String), [roleId, id]),
    );
    expect(result).toEqual(userIds.length);
  });
});
