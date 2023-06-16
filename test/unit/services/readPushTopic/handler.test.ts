// Mocks
jest.mock('../../../../src/services/readPushTopic/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/readPushTopic/apiHandler';
import provider from '../../../../src/services/readPushTopic/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/readPushTopic/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const topicName = 'test-topic-name';
  const topicInfo = { topic_id: 123, topic_name: topicName, created_at: 'created_at' };

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

  it('should call next with TopicNotFound error when provider returns 0', async () => {
    const expectedError = new AppError(errDef[404].TopicNotFound);

    mockedProvider.mockResolvedValue(0);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(topicName);
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return 200 when provider returns 1', async () => {
    mockedProvider.mockResolvedValue(topicInfo);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(topicName);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith(topicInfo);
    expect(next).not.toBeCalled();
  });
});
