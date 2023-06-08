//Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

//Imports
import { PushSubscription } from 'web-push';
import provider from '../../../../src/services/saveSubscription/provider';
import db from '../../../../src/utils/db';

const mockedQuery = db.query as jest.Mock;

//Tests
describe('Test /src/services/saveSubscription/provider', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const subscription: PushSubscription = {
    endpoint: 'endpoint',
    keys: { auth: 'auth', p256dh: 'p256dh' },
  };
  const sub = JSON.stringify(subscription);

  it('should return nothing if the subscription already exists', async () => {
    const topic = 'existing-topic';

    await provider(subscription, topic);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [sub, topic]);
  });

  it('should insert the subscription if it does not exist', async () => {
    const topic = 'existing-topic';

    await provider(subscription, topic);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [sub, topic]);
  });
});
