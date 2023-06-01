//Mocks
const mockedClient = {
  query: jest.fn(),
};
jest.mock('../../utils/db', () => ({
  transaction: jest.fn(async (callback: any) => await callback(mockedClient)),
}));

//Imports
import { QueryResult } from 'pg';
import { PushSubscription } from 'web-push';
import provider from '../../services/saveSubscription/provider';
import db from '../../utils/db';

//Tests
describe('Test /src/services/saveSubscription/provider', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockedDb = db as jest.Mocked<typeof db>;
  const subscription: PushSubscription = {
    endpoint: 'endpoint',
    keys: { auth: 'auth', p256dh: 'p256dh' },
  };
  const sub = JSON.stringify(subscription);

  it('should return false if the topic does not exist', async () => {
    const topic = 'nonexistent-topic';
    mockedClient.query.mockResolvedValue({ rowCount: 0 });

    const result = await provider(subscription, topic);

    expect(result).toBe(false);
    expect(mockedDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockedDb.transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(mockedClient.query).toHaveBeenCalledTimes(1);
    expect(mockedClient.query).toHaveBeenCalledWith(expect.any(String), [topic]);
  });

  it('should return true if the subscription already exists', async () => {
    const topic = 'existing-topic';
    mockedClient.query.mockResolvedValue({ rowCount: 1 });

    const result = await provider(subscription, topic);

    expect(result).toBe(true);
    expect(mockedDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockedDb.transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(mockedClient.query).toHaveBeenCalledTimes(2);
    expect(mockedClient.query).toHaveBeenNthCalledWith(1, expect.any(String), [topic]);
    expect(mockedClient.query).toHaveBeenNthCalledWith(2, expect.any(String), [sub]);
  });

  it('should insert the subscription and return true if it does not exist', async () => {
    const topic = 'existing-topic';
    mockedClient.query
      .mockReturnValueOnce(Promise.resolve({ rowCount: 1 }))
      .mockReturnValueOnce(Promise.resolve({ rowCount: 0 }));

    const result = await provider(subscription, topic);

    expect(result).toBe(true);
    expect(mockedDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockedDb.transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(mockedClient.query).toHaveBeenCalledTimes(3);
    expect(mockedClient.query).toHaveBeenNthCalledWith(1, expect.any(String), [topic]);
    expect(mockedClient.query).toHaveBeenNthCalledWith(2, expect.any(String), [sub]);
    expect(mockedClient.query).toHaveBeenNthCalledWith(3, expect.any(String), [sub, topic]);
  });
});
