// Mocks
jest.mock('../../../../src/services/saveSubscription/provider', () => jest.fn());
jest.mock('../../../../src/utils/webpush', () => ({
  isValidSub: jest.fn(),
  isValidTopic: jest.fn(),
}));
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/saveSubscription/apiHandler';
import provider from '../../../../src/services/saveSubscription/provider';
import db from '../../../../src/utils/db';
import { AppError, errDef } from '../../../../src/utils/errors';
import { isValidSub, isValidTopic } from '../../../../src/utils/webpush';

const mockedProvider = provider as jest.Mock;
const mockedSubValidator = isValidSub as jest.Mock;
const mockedTopicValidator = isValidTopic as jest.Mock;
const mockedQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/saveSubscription/apiHandler', () => {
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
      const subscription = { endpoint: '', keys: { auth: '', p256dh: '' } };
      const topic = 'valid-topic';
      req.body = { topic, subscription };
      mockedSubValidator.mockReturnValue(false);
      const expectedError = new AppError(errDef[400].InvalidPushSubscription);

      await handler(req, res, next);

      expect(isValidSub).toBeCalledWith(subscription);
      expect(provider).not.toHaveBeenCalled();
      expect(res.sendStatus).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expectedError);
    });

    it('should call next with InvalidPushTopic error if the topic is invalid', async () => {
      const subscription = { endpoint: 'endpoint', keys: { auth: 'auth', p256dh: 'p256dh' } };
      const topic = 'a'.repeat(51);
      req.body = { topic, subscription };
      mockedSubValidator.mockReturnValue(true);
      mockedTopicValidator.mockReturnValue(false);
      const expectedError = new AppError(errDef[400].InvalidPushTopic);

      await handler(req, res, next);

      expect(isValidTopic).toBeCalledWith(topic);
      expect(provider).not.toHaveBeenCalled();
      expect(res.sendStatus).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expectedError);
    });

    it('should call next with InvalidPushTopic error if topic does not exist in DB', async () => {
      const subscription = { endpoint: 'endpoint', keys: { auth: 'auth', p256dh: 'p256dh' } };
      const topic = 'valid-topic';
      req.body = { topic, subscription };
      mockedSubValidator.mockReturnValue(true);
      mockedTopicValidator.mockReturnValue(true);
      mockedQuery.mockReturnValue({ rowCount: 0 });
      const expectedError = new AppError(errDef[400].InvalidPushTopic);

      await handler(req, res, next);

      expect(db.query).toBeCalledWith(expect.any(String), [topic]);
      expect(provider).not.toHaveBeenCalled();
      expect(res.sendStatus).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expectedError);
    });

    it('should call provider and send status 200 if the subscription and topic are valid', async () => {
      const subscription = { endpoint: 'endpoint', keys: { auth: 'auth', p256dh: 'p256dh' } };
      const topic = 'valid-topic';
      req.body = { topic, subscription };
      mockedSubValidator.mockReturnValue(true);
      mockedTopicValidator.mockReturnValue(true);
      mockedQuery.mockReturnValue({ rowCount: 1 });
      mockedProvider.mockResolvedValue(true);

      await handler(req, res, next);

      expect(isValidSub).toBeCalledWith(subscription);
      expect(isValidTopic).toBeCalledWith(topic);
      expect(db.query).toBeCalledWith(expect.any(String), [topic]);
      expect(provider).toHaveBeenCalledWith(subscription, topic);
      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
