// Mocks
jest.mock('../../../../src/utils/webpush', () => ({
  sendNotiByTopic: jest.fn(),
}));

// Imports
import provider from '../../../../src/services/sendNoti/provider';
import webpush from '../../../../src/utils/webpush';

// Tests
describe('Test /src/services/sendNoti/provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call sendNotiByTopic with the correct arguments', async () => {
    const topic = 'test-topic';
    const payload = { message: 'Hello, world!' };
    const payloadStr = JSON.stringify(payload);

    await provider(topic, payload);

    expect(webpush.sendNotiByTopic).toHaveBeenCalledTimes(1);
    expect(webpush.sendNotiByTopic).toHaveBeenCalledWith(topic, payloadStr, {
      contentEncoding: 'aes128gcm',
    });
  });
});
