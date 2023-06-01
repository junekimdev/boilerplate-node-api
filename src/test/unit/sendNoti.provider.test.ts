// Mocks
jest.mock('../../utils', () => ({
  webpush: {
    sendNotiByTopic: jest.fn(),
  },
}));

// Imports
import provider from '../../services/sendNoti/provider';
import { webpush } from '../../utils';

const mockedWebpush = webpush as jest.Mocked<typeof webpush>;

// Tests
describe('Test /src/services/sendNoti/provider', () => {
  beforeEach(() => {
    mockedWebpush.sendNotiByTopic.mockClear();
  });

  it('should call sendNotiByTopic with the correct arguments', async () => {
    const topic = 'test-topic';
    const payload = { message: 'Hello, world!' };
    const payloadStr = JSON.stringify(payload);

    await provider(topic, payload);

    expect(mockedWebpush.sendNotiByTopic).toHaveBeenCalledTimes(1);
    expect(mockedWebpush.sendNotiByTopic).toHaveBeenCalledWith(topic, payloadStr, {
      contentEncoding: 'aes128gcm',
    });
  });
});
