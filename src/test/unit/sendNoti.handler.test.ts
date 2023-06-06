// Mocks
jest.mock('../../services/sendNoti/provider', () => jest.fn());
jest.mock('../../utils/webpush', () => ({ isValidTopic: jest.fn() }));
jest.mock('../../utils/db', () => ({ query: jest.fn() }));

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../services/sendNoti/apiHandler';
import provider from '../../services/sendNoti/provider';
import db from '../../utils/db';
import { AppError, errDef } from '../../utils/errors';
import { isValidTopic } from '../../utils/webpush';

const mockedProvider = provider as jest.Mock;
const mockedTopicValidator = isValidTopic as jest.Mock;
const mockedQuery = db.query as jest.Mock;

// Tests
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

  it('should call next with InvalidPushTopic error when the topic is invalid', async () => {
    const topic = 'invalid-topic';
    const payload = { message: 'Hello, world!' };
    req.body = { topic, payload };
    mockedTopicValidator.mockReturnValue(false);
    const expectedError = new AppError(errDef[400].InvalidPushTopic);

    await handler(req, res, next);

    expect(isValidTopic).toBeCalledWith(topic);
    expect(provider).not.toHaveBeenCalled();
    expect(res.sendStatus).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should call next with InvalidPayload error when the payload is missing', async () => {
    const topic = 'test-topic';
    req.body = { topic };
    mockedTopicValidator.mockReturnValue(true);
    const expectedError = new AppError(errDef[400].InvalidPayload);

    await handler(req, res, next);

    expect(provider).not.toHaveBeenCalled();
    expect(res.sendStatus).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should call next with InvalidPushTopic error if topic does not exist in DB', async () => {
    const topic = 'invalid-topic';
    const payload = { message: 'Hello, world!' };
    req.body = { topic, payload };
    mockedTopicValidator.mockReturnValue(true);
    mockedQuery.mockReturnValue({ rowCount: 0 });
    const expectedError = new AppError(errDef[400].InvalidPushTopic);

    await handler(req, res, next);

    expect(db.query).toBeCalledWith(expect.any(String), [topic]);
    expect(provider).not.toHaveBeenCalled();
    expect(res.sendStatus).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should call provider and sendStatus with 200 when the request is valid', async () => {
    const topic = 'test-topic';
    const payload = { message: 'Hello, world!' };
    req.body = { topic, payload };
    mockedTopicValidator.mockReturnValue(true);
    mockedQuery.mockReturnValue({ rowCount: 1 });

    await handler(req, res, next);

    expect(provider).toHaveBeenCalledWith(topic, payload);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });
});
