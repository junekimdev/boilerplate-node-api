//Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

//Imports
import { PushSubscription } from 'web-push';
import provider from '../../../../src/services/saveSubscription/provider';
import db from '../../../../src/utils/db';

const mockedQuery = db.query as jest.Mock;

//Tests
describe('Test /src/services/saveSubscription/provider', () => {
  const subscription: PushSubscription = {
    endpoint: 'endpoint',
    keys: { auth: 'auth', p256dh: 'p256dh' },
  };
  const sub = JSON.stringify(subscription);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 0 if the subscription already exists', async () => {
    const topic = 'existing-topic';

    mockedQuery.mockResolvedValue({ rowCount: 0 });

    const result = await provider(subscription, topic);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [sub, topic]);
    expect(result).toBe(0);
  });

  it('should insert the subscription and return 1 if it does not exist', async () => {
    const topic = 'new-topic';

    mockedQuery.mockResolvedValue({ rowCount: 1 });

    const result = await provider(subscription, topic);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [sub, topic]);
    expect(result).toBe(1);
  });
});
