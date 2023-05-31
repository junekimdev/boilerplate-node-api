// In typescript testing, mockings should come before imports
const mockQueryResult = {
  rows: [
    { id: 1, sub: JSON.stringify({ endpoint: 'endpoint1' }) },
    { id: 2, sub: JSON.stringify({ endpoint: 'endpoint2' }) },
    { id: 3, sub: JSON.stringify({ endpoint: 'endpoint3' }) },
  ],
};
const mockedlogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock('web-push', () => {
  return {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn(
      async (topic: string, payload?: string, option?: { opt: string }) => {},
    ),
  };
});
jest.mock('../../utils/db', () => {
  return { query: jest.fn((sql: string, params?: any[]) => mockQueryResult) };
});
jest.mock('../../utils/logger', () => {
  return { logger: mockedlogger };
});

// Imports
import webpush, { RequestOptions } from 'web-push';
import db from '../../utils/db';
import { logger } from '../../utils/logger';
import webpushUtil from '../../utils/webpush';

// Tests
describe('Test /src/util/webpush', () => {
  const topic = 'topic1';
  const payload = 'payload';
  const option: RequestOptions = { contentEncoding: 'aes128gcm' };
  const subObj = JSON.parse(mockQueryResult.rows[0].sub);

  describe('sendNotiByTopic()', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should send notifications to all of those who subscribe a topic', async () => {
      await webpushUtil.sendNotiByTopic(topic, payload, option);

      expect(db.query).toBeCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [topic]);
      expect(webpush.sendNotification).toBeCalledTimes(mockQueryResult.rows.length);
      expect(webpush.sendNotification).toHaveBeenNthCalledWith(1, subObj, payload, option);
      expect(db.query).toBeCalledTimes(1);
    });

    it('should delete subscribers if notification sending fails with 404 or 410 status code', async () => {
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 404 });
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 410 });
      const idsToDelete = [mockQueryResult.rows[0].id, mockQueryResult.rows[1].id];

      await webpushUtil.sendNotiByTopic(topic, payload, option);

      expect(db.query).toBeCalledTimes(2);
      expect(db.query).toHaveBeenNthCalledWith(1, expect.any(String), [topic]);
      expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), idsToDelete);
      expect(webpush.sendNotification).toBeCalledTimes(mockQueryResult.rows.length);
    });

    it('should throw an error if an error occurs during transaction', async () => {
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 404 });
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce(new Error('err'));

      await expect(webpushUtil.sendNotiByTopic(topic, payload, option)).rejects.toThrow('err');

      expect(db.query).toBeCalledTimes(2);
      expect(db.query).toHaveBeenNthCalledWith(1, expect.any(String), [topic]);
      expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [mockQueryResult.rows[0].id]);
      expect(webpush.sendNotification).toBeCalledTimes(mockQueryResult.rows.length);
    });

    it('should leave a info level log about success when there is no unsubscriber and error', async () => {
      await webpushUtil.sendNotiByTopic(topic, payload, option);

      expect(logger.info).toBeCalledTimes(1);
    });

    it('should leave a info level log about success and unsubscribers when there is no error', async () => {
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 404 });

      await webpushUtil.sendNotiByTopic(topic, payload, option);

      expect(logger.info).toBeCalledTimes(2);
    });

    it('should throw an error and leave an error level log about the error as well as info level log about success and unsubscribers', async () => {
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 404 });
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce(new Error('err'));

      await expect(webpushUtil.sendNotiByTopic(topic, payload, option)).rejects.toThrow('err');

      expect(logger.info).toBeCalledTimes(2);
      expect(logger.error).toBeCalledTimes(1);
    });
  });

  describe('sendNotiToAll()', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should send notifications to every subscriber in push notification DB', async () => {
      await webpushUtil.sendNotiToAll(payload, option);

      expect(db.query).toBeCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(expect.any(String));
      expect(webpush.sendNotification).toBeCalledTimes(mockQueryResult.rows.length);
      expect(webpush.sendNotification).toHaveBeenNthCalledWith(1, subObj, payload, option);
    });

    it('should delete subscribers if notification sending fails with 404 or 410 status code', async () => {
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 404 });
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 410 });
      const idsToDelete = [mockQueryResult.rows[0].id, mockQueryResult.rows[1].id];

      await webpushUtil.sendNotiToAll(payload, option);

      expect(db.query).toBeCalledTimes(2);
      expect(db.query).toHaveBeenNthCalledWith(1, expect.any(String));
      expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), idsToDelete);
      expect(webpush.sendNotification).toBeCalledTimes(mockQueryResult.rows.length);
    });

    it('should throw an error if an error occurs during transaction', async () => {
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 404 });
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce(new Error('err'));

      await expect(webpushUtil.sendNotiToAll(payload, option)).rejects.toThrow('err');

      expect(db.query).toBeCalledTimes(2);
      expect(db.query).toHaveBeenNthCalledWith(1, expect.any(String));
      expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [mockQueryResult.rows[0].id]);
      expect(webpush.sendNotification).toBeCalledTimes(mockQueryResult.rows.length);
    });

    it('should leave a info level log about success when there is no unsubscriber and error', async () => {
      await webpushUtil.sendNotiToAll(payload, option);

      expect(logger.info).toBeCalledTimes(1);
    });

    it('should leave a info level log about success and unsubscribers when there is no error', async () => {
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 404 });

      await webpushUtil.sendNotiToAll(payload, option);

      expect(logger.info).toBeCalledTimes(2);
    });

    it('should throw an error and leave an error level log about the error as well as info level log about success and unsubscribers', async () => {
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 404 });
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce(new Error('err'));

      await expect(webpushUtil.sendNotiToAll(payload, option)).rejects.toThrow('err');

      expect(logger.info).toBeCalledTimes(2);
      expect(logger.error).toBeCalledTimes(1);
    });
  });
});
