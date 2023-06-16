// Mocks
jest.mock('../../../../src/services/updatePushTopic/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/updatePushTopic/apiHandler';
import provider from '../../../../src/services/updatePushTopic/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/updatePushTopic/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const topicName = 'oldName';
  const topic_name = 'newName';
  const update_data = { topic_name };
  const topicId = 123;

  beforeEach(() => {
    req = { body: { update_data } } as unknown as Request;
    res = {
      locals: { topicName },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  const invalidDataCases = [123, 'string', ['array']];

  it.each(invalidDataCases)(
    'should call next with InvalidData error when %s as update_data is invalid',
    async (data) => {
      const expectedError = new AppError(errDef[400].InvalidData);

      req.body = { update_data: data };

      await handler(req, res, next);

      expect(provider).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(res.json).not.toBeCalled();
      expect(next).toBeCalledWith(expectedError);
    },
  );

  it('should call next with InvalidPushTopic error when topic_name is not a string', async () => {
    const expectedError = new AppError(errDef[400].InvalidPushTopic);

    req.body = { update_data: { topic_name: 1 } };

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return 200 with topic_id when provider returns topic id', async () => {
    mockedProvider.mockResolvedValue(topicId);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(topicName, topic_name);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith({ topic_id: topicId });
    expect(next).not.toBeCalled();
  });
});
