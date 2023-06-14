// Mocks
const client = { query: jest.fn() };
jest.mock('../../../../src/utils/db', () => ({ transaction: jest.fn((f) => f(client)) }));

// Imports
import provider from '../../../../src/services/updateRole/provider';
import { IPermission } from '../../../../src/utils/access';
import db from '../../../../src/utils/db';
import { AppError, errDef } from '../../../../src/utils/errors';

// Tests
describe('Test /src/services/updateRole/provider', () => {
  const oldName = 'oldName';
  const newName = 'newName';
  const roleId = 123;
  const permissions: IPermission[] = [
    { res_name: 'res1', readable: true, writable: false },
    { res_name: 'res2', readable: false, writable: true },
    { res_name: 'res3', readable: true, writable: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should take a oldName, newName, and permissions and return id when successful', async () => {
    client.query
      .mockResolvedValueOnce({ rows: [{ id: roleId }] })
      .mockResolvedValue({ rowCount: 1 });

    const result = await provider(oldName, newName, permissions);

    expect(result).toEqual(roleId);
  });

  it('should get role id first', async () => {
    client.query
      .mockResolvedValueOnce({ rows: [{ id: roleId }] })
      .mockResolvedValue({ rowCount: 1 });

    await provider(oldName, newName, permissions);

    expect(client.query).nthCalledWith(1, expect.any(String), [oldName]);
  });

  it("should update role's name only when new name is different from old name", async () => {
    client.query
      .mockResolvedValueOnce({ rows: [{ id: roleId }] })
      .mockResolvedValue({ rowCount: 1 });

    await provider(oldName, newName, permissions);

    expect(client.query).nthCalledWith(2, expect.any(String), [roleId, newName]);
  });

  it("should not update role's name if new name is same with old name", async () => {
    client.query
      .mockResolvedValueOnce({ rows: [{ id: roleId }] })
      .mockResolvedValue({ rowCount: 1 });

    await provider(oldName, oldName, permissions);

    expect(client.query).not.nthCalledWith(2, expect.any(String), [roleId, oldName]);
  });

  it('should delete old permissions and replace with new one', async () => {
    client.query
      .mockResolvedValueOnce({ rows: [{ id: roleId }] })
      .mockResolvedValue({ rowCount: 1 });

    await provider(oldName, newName, permissions);

    expect(client.query).toBeCalledTimes(4 + permissions.length);
    expect(client.query).nthCalledWith(3, expect.any(String), [roleId]);
    permissions.forEach((permit, i) => {
      const { res_name, readable, writable } = permit;
      expect(client.query).nthCalledWith(4 + i, expect.any(String), [
        roleId,
        res_name,
        readable,
        writable,
      ]);
    });
  });

  it('should throw FailedToInsert error while an error occurs', async () => {
    const expectedError = new AppError(errDef[500].FailedToInsert);

    client.query
      .mockResolvedValueOnce({ rows: [{ id: roleId }] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 0 });

    try {
      await provider(oldName, newName, permissions);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });

  it('should invalidate refresh tokens of all user in the role', async () => {
    client.query
      .mockResolvedValueOnce({ rows: [{ id: roleId }] })
      .mockResolvedValue({ rowCount: 1 });

    await provider(oldName, newName, permissions);

    expect(client.query).nthCalledWith(7, expect.any(String), [roleId]);
  });
});
