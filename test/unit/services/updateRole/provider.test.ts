// Mocks
const client = { query: jest.fn() };
jest.mock('../../../../src/utils/db', () => ({ transaction: jest.fn((f) => f(client)) }));

// Imports
import provider from '../../../../src/services/updateRole/provider';
import { IPermission } from '../../../../src/utils/access';
import db from '../../../../src/utils/db';
import { UK_ERR_CODE } from '../../../../src/utils/errors';
import { getDbErrorMock } from '../../../testUtil';

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

  it('should return 0 when new name already exists', async () => {
    const dbError = getDbErrorMock(UK_ERR_CODE);

    client.query.mockResolvedValueOnce({ rows: [{ id: roleId }] }).mockRejectedValue(dbError);

    const result = await provider(oldName, newName, permissions);

    expect(client.query).nthCalledWith(2, expect.any(String), [roleId, newName]);
    expect(result).toBe(0);
  });

  it('should throw the error if db throws an error', async () => {
    const expectedError = new Error();

    client.query.mockResolvedValueOnce({ rows: [{ id: roleId }] }).mockRejectedValue(expectedError);

    try {
      await provider(oldName, newName, permissions);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });

  it('should delete old permissions and replace with new one', async () => {
    client.query
      .mockResolvedValueOnce({ rows: [{ id: roleId }] })
      .mockResolvedValue({ rowCount: 1 });

    await provider(oldName, newName, permissions);

    expect(client.query).toBeCalledTimes(3 + permissions.length);
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

  it('should take a oldName, newName, and permissions and return id when successful', async () => {
    client.query
      .mockResolvedValueOnce({ rows: [{ id: roleId }] })
      .mockResolvedValue({ rowCount: 1 });

    const result = await provider(oldName, newName, permissions);

    expect(result).toEqual(roleId);
  });
});
