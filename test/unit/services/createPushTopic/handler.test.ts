// Mocks
jest.mock('../../../../src/services/createPushTopic/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/createPushTopic/apiHandler';
import provider from '../../../../src/services/createPushTopic/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/createPushTopic/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const topicName = 'topicName';
  const topicId = 123;

  beforeEach(() => {
    req = { body: {} } as unknown as Request;
    res = {
      locals: { topicName },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with PushTopicAlreadyExists error when provider returns 0', async () => {
    const expectedError = new AppError(errDef[409].PushTopicAlreadyExists);

    mockedProvider.mockResolvedValue(0);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(topicName);
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return topic_id with 201 when provider returns topic id', async () => {
    mockedProvider.mockResolvedValue(topicId);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(topicName);
    expect(res.status).toBeCalledWith(201);
    expect(res.json).toBeCalledWith({ topic_id: topicId });
    expect(next).not.toBeCalled();
  });
});
