// Mocks
const mockErrdef = {
  400: { InvalidPushSubscription: 'InvalidPushSubscription', InvalidPushTopic: 'InvalidPushTopic' },
};
jest.mock('../../utils/errors', () => ({
  AppError: jest.fn((msg: string) => new Error(msg)),
  errDef: mockErrdef,
}));
jest.mock('../../services/saveSubscription/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler, { isValidSub, isValidTopic } from '../../services/saveSubscription/apiHandler';
import provider from '../../services/saveSubscription/provider';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/saveSubscription/apiHandler', () => {
  describe('isValidSub()', () => {
    it('should return true if the subscription is valid', () => {
      const sub = { endpoint: 'endpoint', keys: { auth: 'auth', p256dh: 'p256dh' } };
      const result = isValidSub(sub);
      expect(result).toBe(true);
    });

    it('should return false if the subscription is invalid', () => {
      expect(isValidSub({ endpoint: 'a', keys: { auth: 'a', p256dh: '' } })).toBe(false);
      expect(isValidSub({ endpoint: 'a', keys: { auth: '', p256dh: 'a' } })).toBe(false);
      expect(isValidSub({ endpoint: '', keys: { auth: 'a', p256dh: 'a' } })).toBe(false);
      expect(isValidSub({ endpoint: 'a', keys: { auth: '', p256dh: '' } })).toBe(false);
      expect(isValidSub({ endpoint: '', keys: { auth: 'a', p256dh: '' } })).toBe(false);
      expect(isValidSub({ endpoint: '', keys: { auth: '', p256dh: 'a' } })).toBe(false);
      expect(isValidSub({ endpoint: '', keys: { auth: '', p256dh: '' } })).toBe(false);
      expect(isValidSub({ endpoint: 'a' })).toBe(false);
      expect(isValidSub({ keys: { auth: 'a', p256dh: 'a' } })).toBe(false);
      expect(isValidSub({ keys: { auth: 'a' } })).toBe(false);
      expect(isValidSub({ keys: { p256dh: 'a' } })).toBe(false);
      expect(isValidSub({ endpoint: 'a', keys: { auth: 'a' } })).toBe(false);
      expect(isValidSub({ endpoint: 'a', keys: { p256dh: 'a' } })).toBe(false);
      expect(isValidSub({ endpoint: 'a', keys: {} })).toBe(false);
      expect(isValidSub({})).toBe(false);
    });
  });

  describe('isValidTopic()', () => {
    it('should return true if the topic is valid', () => {
      const topic = 'valid-topic';
      const result = isValidTopic(topic);
      expect(result).toBe(true);
    });

    it('should return false if the topic is invalid', () => {
      expect(isValidTopic('')).toBe(false);
      expect(isValidTopic('a'.repeat(51))).toBe(false);
    });
  });

  describe('handler', () => {
    let req: Request;
    let res: Response;
    let next: NextFunction;

    beforeEach(() => {
      req = { body: {} } as Request;
      res = { sendStatus: jest.fn() } as unknown as Response;
      next = jest.fn() as NextFunction;
      jest.clearAllMocks();
    });

    it('should call next with InvalidPushSubscription error if the subscription is invalid', async () => {
      const sub = { endpoint: '', keys: { auth: '', p256dh: '' } };
      req.body = { topic: 'valid-topic', subscription: sub };
      const expectedError = new Error(mockErrdef[400].InvalidPushSubscription);

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(expectedError);
      expect(res.sendStatus).not.toHaveBeenCalled();
    });

    it('should call next with InvalidPushTopic error if the topic is invalid', async () => {
      const sub = { endpoint: 'endpoint', keys: { auth: 'auth', p256dh: 'p256dh' } };
      req.body = { topic: 'a'.repeat(51), subscription: sub };
      const expectedError = new Error(mockErrdef[400].InvalidPushTopic);

      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(expectedError);
      expect(res.sendStatus).not.toHaveBeenCalled();
    });

    it('should call provider and send status 200 if the subscription and topic are valid', async () => {
      const sub = { endpoint: 'endpoint', keys: { auth: 'auth', p256dh: 'p256dh' } };
      req.body = { topic: 'valid-topic', subscription: sub };
      mockedProvider.mockResolvedValue(true);

      await handler(req, res, next);

      expect(provider).toHaveBeenCalledTimes(1);
      expect(provider).toHaveBeenCalledWith(sub, 'valid-topic');
      expect(next).not.toHaveBeenCalled();
      expect(res.sendStatus).toHaveBeenCalledWith(200);
    });

    it('should call next with InvalidPushTopic error if provider returns false', async () => {
      const sub = { endpoint: 'endpoint', keys: { auth: 'auth', p256dh: 'p256dh' } };
      req.body = { topic: 'valid-topic', subscription: sub };
      const expectedError = new Error(mockErrdef[400].InvalidPushTopic);
      mockedProvider.mockResolvedValue(false);

      await handler(req, res, next);

      expect(provider).toHaveBeenCalledTimes(1);
      expect(provider).toHaveBeenCalledWith(sub, 'valid-topic');
      expect(next).toHaveBeenCalledWith(expectedError);
      expect(res.sendStatus).not.toHaveBeenCalled();
    });
  });
});
