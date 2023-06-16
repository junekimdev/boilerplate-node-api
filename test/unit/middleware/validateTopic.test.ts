// Imports
import { NextFunction, Request, Response } from 'express';
import validateTopic from '../../../src/middleware/validateTopic';
import { AppError, errDef } from '../../../src/utils/errors';

// Tests
describe('Test /src/middleware/validateTopic', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const topic_name = 'test-topic_name';

  beforeEach(() => {
    req = { body: { topic_name } } as unknown as Request;
    res = { locals: {} } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with InvalidPushTopic error when topic_name in req.body is not a string', async () => {
    const expectedError = new AppError(errDef[400].InvalidPushTopic);

    req.body = { topic_name: 123 };

    await validateTopic(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });

  it('should put topicName in res.locals and call next', async () => {
    await validateTopic(req, res, next);

    expect(res.locals).toHaveProperty('topicName');
    expect(next).toBeCalledWith();
  });
});
