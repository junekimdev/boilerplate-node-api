// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/deletePushTopic/provider';
import db from '../../../../src/utils/db';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/deletePushTopic/provider', () => {
  const topicName = 'topicName';
  const topicId = 123;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 0 when topic does not exist', async () => {
    mockedDbQuery.mockResolvedValue({ rowCount: 0 });

    const result = await provider(topicName);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [topicName]);
    expect(result).toEqual(0);
  });

  it('should return topic id when deleted successfully', async () => {
    mockedDbQuery.mockResolvedValue({ rowCount: 1, rows: [{ id: topicId }] });

    const result = await provider(topicName);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [topicName]);
    expect(result).toEqual(topicId);
  });
});
