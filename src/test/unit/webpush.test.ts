// In typescript testing, mockings should come before imports
const mockQueryResult = {
  rows: [
    { id: 1, sub: JSON.stringify({ endpoint: 'endpoint1' }) },
    { id: 2, sub: JSON.stringify({ endpoint: 'endpoint2' }) },
    { id: 3, sub: JSON.stringify({ endpoint: 'endpoint3' }) },
  ],
};
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

// Imports
import webpush, { RequestOptions } from 'web-push';
import db from '../../utils/db';
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
    });

    it('should delete the subscriber if notification sending fails with 404 or 410 status code', async () => {
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 404 });
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 410 });

      await webpushUtil.sendNotiByTopic(topic, payload, option);

      expect(db.query).toBeCalledTimes(3);
      expect(db.query).toHaveBeenNthCalledWith(1, expect.any(String), [topic]);
      expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [mockQueryResult.rows[0].id]);
      expect(db.query).toHaveBeenNthCalledWith(3, expect.any(String), [mockQueryResult.rows[1].id]);
      expect(webpush.sendNotification).toBeCalledTimes(mockQueryResult.rows.length);
    });

    it('should throw an error if an error occurs during transaction', async () => {
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce(new Error('err'));

      await expect(webpushUtil.sendNotiByTopic(topic, payload, option)).rejects.toThrow('err');
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

    it('should delete the subscriber if notification sending fails with 404 or 410 status code', async () => {
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 404 });
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 410 });

      await webpushUtil.sendNotiToAll(payload, option);

      expect(db.query).toBeCalledTimes(3);
      expect(db.query).toHaveBeenNthCalledWith(1, expect.any(String));
      expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [mockQueryResult.rows[0].id]);
      expect(db.query).toHaveBeenNthCalledWith(3, expect.any(String), [mockQueryResult.rows[1].id]);
      expect(webpush.sendNotification).toBeCalledTimes(mockQueryResult.rows.length);
    });

    it('should throw an error if an error occurs during transaction', async () => {
      (webpush.sendNotification as jest.Mock).mockRejectedValueOnce(new Error('err'));

      await expect(webpushUtil.sendNotiToAll(payload, option)).rejects.toThrow('err');
    });
  });
});
