// Mocks
const client = { query: jest.fn() };
jest.mock('../../../../src/utils/db', () => ({ transaction: jest.fn((f) => f(client)) }));

// Imports
import provider from '../../../../src/services/createRole/provider';
import { IPermission } from '../../../../src/utils/access';
import db from '../../../../src/utils/db';
import { UK_ERR_CODE } from '../../../../src/utils/errors';

// Tests
describe('Test /src/services/createRole/provider', () => {
  const roleName = 'test-role';
  const roleId = 123;
  const permissions: IPermission[] = [
    { res_name: 'res1', readable: true, writable: false },
    { res_name: 'res2', readable: false, writable: true },
    { res_name: 'res3', readable: true, writable: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 0 when the role already exists', async () => {
    client.query.mockResolvedValue({ rowCount: 0 });

    const result = await provider(roleName, permissions);

    expect(db.transaction).toBeCalledTimes(1);
    expect(client.query).toBeCalledTimes(1);
    expect(client.query).toBeCalledWith(expect.any(String), [roleName]);
    expect(result).toBe(0);
  });

  it('should take a roleName and permissions and create a role and accesses in DB', async () => {
    client.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: roleId }] })
      .mockResolvedValue({ rowCount: 1 });

    const result = await provider(roleName, permissions);

    expect(db.transaction).toBeCalledTimes(1);
    expect(client.query).toBeCalledTimes(1 + permissions.length);
    expect(client.query).nthCalledWith(1, expect.any(String), [roleName]);
    permissions.forEach((permit, i) => {
      const { res_name, readable, writable } = permit;
      expect(client.query).nthCalledWith(2 + i, expect.any(String), [
        roleId,
        res_name,
        readable,
        writable,
      ]);
    });
    expect(result).toBe(roleId);
  });
});
