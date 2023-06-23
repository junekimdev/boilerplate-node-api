// Mocks
jest.mock('../../../../src/services/updateUserPic/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/deleteUserPic/apiHandler';
import provider from '../../../../src/services/updateUserPic/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/deleteUserPic/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const userId = 123;

  beforeEach(() => {
    req = { body: {} } as unknown as Request;
    res = {
      locals: { userId },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
      sendFile: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with UserNotFound error when provider returns 0', async () => {
    const expectedError = new AppError(errDef[404].UserNotFound);

    mockedProvider.mockResolvedValue(0);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(userId, '');
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return 200 when provider returns user id', async () => {
    mockedProvider.mockResolvedValue(userId);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(userId, '');
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith({ user_id: userId });
    expect(next).not.toBeCalled();
  });
});
