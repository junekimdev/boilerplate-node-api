// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/readPushTopic/provider';
import db from '../../../../src/utils/db';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/readPushTopic/provider', () => {
  const topicName = 'topicName';
  const topicInfo = { id: 123, name: 'name' };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 0 when topic does not exist', async () => {
    mockedDbQuery.mockReturnValue({ rowCount: 0 });

    const result = await provider(topicName);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [topicName]);
    expect(result).toEqual(0);
  });

  it('should return topic info', async () => {
    mockedDbQuery.mockReturnValue({ rowCount: 1, rows: [topicInfo] });

    const result = await provider(topicName);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [topicName]);
    expect(result).toEqual(topicInfo);
  });
});
