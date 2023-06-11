// Mocks
jest.mock('../../../../src/services/sendNoti/provider', () => jest.fn());
jest.mock('../../../../src/utils/webpush', () => ({ isValidTopic: jest.fn() }));
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/sendNoti/apiHandler';
import provider from '../../../../src/services/sendNoti/provider';
import db from '../../../../src/utils/db';
import { AppError, errDef } from '../../../../src/utils/errors';
import { isValidTopic } from '../../../../src/utils/webpush';

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
    const expectedError = new AppError(errDef[400].InvalidPushTopic);

    req.body = { topic, payload };
    mockedTopicValidator.mockReturnValue(false);

    await handler(req, res, next);

    expect(isValidTopic).toBeCalledWith(topic);
    expect(provider).not.toBeCalled();
    expect(res.sendStatus).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidPayload error when the payload is missing', async () => {
    const topic = 'test-topic';
    const expectedError = new AppError(errDef[400].InvalidPayload);

    req.body = { topic };
    mockedTopicValidator.mockReturnValue(true);

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.sendStatus).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidPushTopic error if topic does not exist in DB', async () => {
    const topic = 'invalid-topic';
    const payload = { message: 'Hello, world!' };
    const expectedError = new AppError(errDef[400].InvalidPushTopic);

    req.body = { topic, payload };
    mockedTopicValidator.mockReturnValue(true);
    mockedQuery.mockReturnValue({ rowCount: 0 });

    await handler(req, res, next);

    expect(db.query).toBeCalledWith(expect.any(String), [topic]);
    expect(provider).not.toBeCalled();
    expect(res.sendStatus).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call provider and sendStatus with 200 when the request is valid', async () => {
    const topic = 'test-topic';
    const payload = { message: 'Hello, world!' };

    req.body = { topic, payload };
    mockedTopicValidator.mockReturnValue(true);
    mockedQuery.mockReturnValue({ rowCount: 1 });

    await handler(req, res, next);

    expect(provider).toBeCalledWith(topic, payload);
    expect(res.sendStatus).toBeCalledWith(200);
    expect(next).not.toBeCalled();
  });
});
