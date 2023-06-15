// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/readRole/provider';
import db from '../../../../src/utils/db';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/readRole/provider', () => {
  const roleName = 'test-role';
  const role_id = 123;
  const permissions = [
    { res_name: 'res1', readable: true, writable: false },
    { res_name: 'res2', readable: false, writable: true },
    { res_name: 'res3', readable: true, writable: true },
  ];
  const created_at = Date.now();
  const roleInfo = { role_id, role_name: roleName, permissions, created_at };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null if role does not exist', async () => {
    mockedDbQuery.mockReturnValue({ rowCount: 0 });

    const result = await provider(roleName);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [roleName]);
    expect(result).toEqual(null);
  });

  it('should get info of roleName from DB anf return it', async () => {
    mockedDbQuery
      .mockReturnValueOnce({ rowCount: 1, rows: [{ id: role_id, created_at }] })
      .mockReturnValue({ rowCount: 3, rows: permissions });

    const result = await provider(roleName);

    expect(db.query).toBeCalledTimes(2);
    expect(db.query).nthCalledWith(1, expect.any(String), [roleName]);
    expect(db.query).nthCalledWith(2, expect.any(String), [roleName]);
    expect(result).toEqual(roleInfo);
  });
});
