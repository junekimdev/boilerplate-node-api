// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/readGroupRole/provider';
import db from '../../../../src/utils/db';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/readGroupRole/provider', () => {
  const roleName = 'roleName';
  const roleId = 123;
  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const ids = [1, 2, 3];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 0 when role does not exist', async () => {
    mockedDbQuery.mockResolvedValue({ rowCount: 0 });

    const result = await provider(roleName);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [roleName]);
    expect(result).toEqual(0);
  });

  it('should return a list of all of user_id in a role', async () => {
    mockedDbQuery
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: roleId }] })
      .mockResolvedValueOnce({ rowCount: 3, rows });

    const result = await provider(roleName);

    expect(db.query).toBeCalledTimes(2);
    expect(db.query).nthCalledWith(1, expect.any(String), [roleName]);
    expect(db.query).nthCalledWith(2, expect.any(String), [roleId]);
    expect(result).toEqual(ids);
  });
});
