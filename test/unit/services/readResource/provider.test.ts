// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/readResource/provider';
import db from '../../../../src/utils/db';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/readResource/provider', () => {
  const resInfo = [
    { id: 1, name: 'res1' },
    { id: 2, name: 'res2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return resouce info', async () => {
    mockedDbQuery.mockResolvedValue({ rows: resInfo });

    const result = await provider();

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String));
    expect(result).toEqual(resInfo);
  });
});
