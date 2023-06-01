// Mocks
const mockErrdef = {
  400: { InvalidPushTopic: 'InvalidPushTopic', InvalidPayload: 'InvalidPayload' },
};
jest.mock('../../utils/errors', () => ({
  AppError: jest.fn((msg: string) => new Error(msg)),
  errDef: mockErrdef,
}));
jest.mock('../../services/sendNoti/provider', () => jest.fn());

import { NextFunction, Request, Response } from 'express';
import handler from '../../services/sendNoti/apiHandler';
import provider from '../../services/sendNoti/provider';

const mockedProvider = provider as jest.MockedFunction<typeof provider>;

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

  it('should call provider and sendStatus with 200 when the request is valid', async () => {
    const topic = 'test-topic';
    const payload = { message: 'Hello, world!' };
    req.body = { topic, payload };

    await handler(req, res, next);

    expect(provider).toHaveBeenCalledTimes(1);
    expect(provider).toHaveBeenCalledWith(topic, payload);
    expect(res.sendStatus).toHaveBeenCalledTimes(1);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with InvalidPushTopic error when the topic is missing', async () => {
    const payload = { message: 'Hello, world!' };
    req.body = { payload };
    const expectedError = new Error(mockErrdef[400].InvalidPushTopic);

    await handler(req, res, next);

    expect(provider).not.toHaveBeenCalled();
    expect(res.sendStatus).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should call next with InvalidPayload error when the payload is missing', async () => {
    const topic = 'test-topic';
    req.body = { topic };
    const expectedError = new Error(mockErrdef[400].InvalidPayload);

    await handler(req, res, next);

    expect(provider).not.toHaveBeenCalled();
    expect(res.sendStatus).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expectedError);
  });
});
