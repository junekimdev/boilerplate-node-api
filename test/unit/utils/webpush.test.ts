// In typescript testing, mockings should come before imports
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));
jest.mock('../../../src/utils/db', () => ({ query: jest.fn() }));
jest.mock('../../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Imports
import webpush, { RequestOptions } from 'web-push';
import db from '../../../src/utils/db';
import { logger } from '../../../src/utils/logger';
import webpushUtil, { isValidSub, isValidTopic } from '../../../src/utils/webpush';

const mockedSendNotification = webpush.sendNotification as jest.Mock;
const mockedQuery = db.query as jest.Mock;

// Tests
describe('Test /src/util/webpush', () => {
  const topic = 'topic1';
  const payload = 'payload';
  const option: RequestOptions = { contentEncoding: 'aes128gcm' };
  const queryResults = {
    rowCount: 3,
    rows: [
      { id: 1, sub: JSON.stringify({ endpoint: 'endpoint1' }) },
      { id: 2, sub: JSON.stringify({ endpoint: 'endpoint2' }) },
      { id: 3, sub: JSON.stringify({ endpoint: 'endpoint3' }) },
    ],
  };
  const subObj = JSON.parse(queryResults.rows[0].sub);
  mockedQuery.mockResolvedValue(queryResults);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendNotiByTopic()', () => {
    it('should send notifications to all of those who subscribe a topic', async () => {
      await webpushUtil.sendNotiByTopic(topic, payload, option);

      expect(db.query).toBeCalledTimes(1);
      expect(db.query).toBeCalledWith(expect.any(String), [topic]);
      expect(webpush.sendNotification).toBeCalledTimes(queryResults.rows.length);
      expect(webpush.sendNotification).nthCalledWith(1, subObj, payload, option);
      expect(db.query).toBeCalledTimes(1);
    });

    it('should delete subscribers if notification sending fails with 404 or 410 status code', async () => {
      mockedSendNotification.mockRejectedValueOnce({ statusCode: 404 });
      mockedSendNotification.mockRejectedValueOnce({ statusCode: 410 });
      const idsToDelete = [queryResults.rows[0].id, queryResults.rows[1].id];

      await webpushUtil.sendNotiByTopic(topic, payload, option);

      expect(db.query).toBeCalledTimes(2);
      expect(db.query).nthCalledWith(1, expect.any(String), [topic]);
      expect(db.query).nthCalledWith(2, expect.any(String), idsToDelete);
      expect(webpush.sendNotification).toBeCalledTimes(queryResults.rows.length);
    });

    it('should throw an error if an error occurs during transaction', async () => {
      mockedSendNotification.mockRejectedValueOnce({ statusCode: 404 });
      mockedSendNotification.mockRejectedValueOnce(new Error('err'));

      await expect(webpushUtil.sendNotiByTopic(topic, payload, option)).rejects.toThrow(
        'WebPush Error',
      );

      expect(db.query).toBeCalledTimes(2);
      expect(db.query).nthCalledWith(1, expect.any(String), [topic]);
      expect(db.query).nthCalledWith(2, expect.any(String), [queryResults.rows[0].id]);
      expect(webpush.sendNotification).toBeCalledTimes(queryResults.rows.length);
    });

    it('should leave a info level log about success when there is no unsubscriber and error', async () => {
      await webpushUtil.sendNotiByTopic(topic, payload, option);

      expect(logger.info).toBeCalledTimes(1);
    });

    it('should leave a info level log about success and unsubscribers when there is no error', async () => {
      mockedSendNotification.mockRejectedValueOnce({ statusCode: 404 });

      await webpushUtil.sendNotiByTopic(topic, payload, option);

      expect(logger.info).toBeCalledTimes(2);
    });

    it('should throw an error and leave an error level log about the error as well as info level log about success and unsubscribers', async () => {
      mockedSendNotification.mockRejectedValueOnce({ statusCode: 404 });
      mockedSendNotification.mockRejectedValueOnce(new Error('err'));
      mockedSendNotification.mockRejectedValueOnce(new Error('err'));

      await expect(webpushUtil.sendNotiByTopic(topic, payload, option)).rejects.toThrow(
        'WebPush Error',
      );

      expect(logger.info).toBeCalledTimes(2);
      expect(logger.error).toBeCalledTimes(3);
    });
  });

  describe('sendNotiToAll()', () => {
    it('should send notifications to every subscriber in push notification DB', async () => {
      await webpushUtil.sendNotiToAll(payload, option);

      expect(db.query).toBeCalledTimes(1);
      expect(db.query).toBeCalledWith(expect.any(String));
      expect(webpush.sendNotification).toBeCalledTimes(queryResults.rows.length);
      expect(webpush.sendNotification).nthCalledWith(1, subObj, payload, option);
    });

    it('should delete subscribers if notification sending fails with 404 or 410 status code', async () => {
      mockedSendNotification.mockRejectedValueOnce({ statusCode: 404 });
      mockedSendNotification.mockRejectedValueOnce({ statusCode: 410 });
      const idsToDelete = [queryResults.rows[0].id, queryResults.rows[1].id];

      await webpushUtil.sendNotiToAll(payload, option);

      expect(db.query).toBeCalledTimes(2);
      expect(db.query).nthCalledWith(1, expect.any(String));
      expect(db.query).nthCalledWith(2, expect.any(String), idsToDelete);
      expect(webpush.sendNotification).toBeCalledTimes(queryResults.rows.length);
    });

    it('should throw an error if an error occurs during transaction', async () => {
      mockedSendNotification.mockRejectedValueOnce({ statusCode: 404 });
      mockedSendNotification.mockRejectedValueOnce(new Error('err'));

      await expect(webpushUtil.sendNotiToAll(payload, option)).rejects.toThrow('WebPush Error');

      expect(db.query).toBeCalledTimes(2);
      expect(db.query).nthCalledWith(1, expect.any(String));
      expect(db.query).nthCalledWith(2, expect.any(String), [queryResults.rows[0].id]);
      expect(webpush.sendNotification).toBeCalledTimes(queryResults.rows.length);
    });

    it('should leave a info level log about success when there is no unsubscriber and error', async () => {
      await webpushUtil.sendNotiToAll(payload, option);

      expect(logger.info).toBeCalledTimes(1);
    });

    it('should leave a info level log about success and unsubscribers when there is no error', async () => {
      mockedSendNotification.mockRejectedValueOnce({ statusCode: 404 });

      await webpushUtil.sendNotiToAll(payload, option);

      expect(logger.info).toBeCalledTimes(2);
    });

    it('should throw an error and leave an error level log about the error as well as info level log about success and unsubscribers', async () => {
      mockedSendNotification.mockRejectedValueOnce({ statusCode: 404 });
      mockedSendNotification.mockRejectedValueOnce(new Error('err'));
      mockedSendNotification.mockRejectedValueOnce(new Error('err'));

      await expect(webpushUtil.sendNotiToAll(payload, option)).rejects.toThrow('WebPush Error');

      expect(logger.info).toBeCalledTimes(2);
      expect(logger.error).toBeCalledTimes(3);
    });
  });

  describe('isValidSub()', () => {
    it('should return true if the subscription is valid', () => {
      const sub = { endpoint: 'endpoint', keys: { auth: 'auth', p256dh: 'p256dh' } };
      const result = isValidSub(sub);
      expect(result).toBeTruthy();
    });

    it('should return false if the subscription is invalid', () => {
      expect(isValidSub({ endpoint: 'a', keys: { auth: 'a', p256dh: '' } })).toBeFalsy();
      expect(isValidSub({ endpoint: 'a', keys: { auth: '', p256dh: 'a' } })).toBeFalsy();
      expect(isValidSub({ endpoint: '', keys: { auth: 'a', p256dh: 'a' } })).toBeFalsy();
      expect(isValidSub({ endpoint: 'a', keys: { auth: '', p256dh: '' } })).toBeFalsy();
      expect(isValidSub({ endpoint: '', keys: { auth: 'a', p256dh: '' } })).toBeFalsy();
      expect(isValidSub({ endpoint: '', keys: { auth: '', p256dh: 'a' } })).toBeFalsy();
      expect(isValidSub({ endpoint: '', keys: { auth: '', p256dh: '' } })).toBeFalsy();
      expect(isValidSub({ endpoint: 'a' })).toBeFalsy();
      expect(isValidSub({ keys: { auth: 'a', p256dh: 'a' } })).toBeFalsy();
      expect(isValidSub({ keys: { auth: 'a' } })).toBeFalsy();
      expect(isValidSub({ keys: { p256dh: 'a' } })).toBeFalsy();
      expect(isValidSub({ endpoint: 'a', keys: { auth: 'a' } })).toBeFalsy();
      expect(isValidSub({ endpoint: 'a', keys: { p256dh: 'a' } })).toBeFalsy();
      expect(isValidSub({ endpoint: 'a', keys: {} })).toBeFalsy();
      expect(isValidSub({})).toBeFalsy();
      expect(isValidSub(undefined)).toBeFalsy();
    });
  });

  describe('isValidTopic()', () => {
    it('should return true if the topic is valid', () => {
      const topic = 'valid-topic';
      const result = isValidTopic(topic);
      expect(result).toBeTruthy();
    });

    it('should return false if the topic is invalid', () => {
      expect(isValidTopic(undefined)).toBeFalsy();
      expect(isValidTopic(0)).toBeFalsy();
      expect(isValidTopic('')).toBeFalsy();
      expect(isValidTopic('a'.repeat(51))).toBeFalsy();
    });
  });
});
