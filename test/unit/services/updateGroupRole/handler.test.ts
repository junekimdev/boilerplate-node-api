// Mocks
jest.mock('../../../../src/services/updateGroupRole/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/updateGroupRole/apiHandler';
import provider from '../../../../src/services/updateGroupRole/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/updateGroupRole/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const roleName = 'roleName';
  const user_ids = [1, 2, 3];

  beforeEach(() => {
    req = { body: { user_ids } } as unknown as Request;
    res = {
      locals: { roleName },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with InvalidUserId error when user_ids is not an array', async () => {
    const expectedError = new AppError(errDef[400].InvalidUserId);

    req.body = { user_ids: '1,2,3' };

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidUserId error when any of user ids is not a number', async () => {
    const expectedError = new AppError(errDef[400].InvalidUserId);

    req.body = { user_ids: [1, 2, '3'] };

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with the error if provider throws an error', async () => {
    const expectedError = new Error('err');

    mockedProvider.mockRejectedValue(expectedError);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(user_ids, roleName);
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return 200 when provider returns number of updates', async () => {
    mockedProvider.mockResolvedValue(user_ids.length);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(user_ids, roleName);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith({ updated: user_ids.length });
    expect(next).not.toBeCalled();
  });
});
