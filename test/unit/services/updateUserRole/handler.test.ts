// Mocks
jest.mock('../../../../src/services/updateUserRole/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/updateUserRole/apiHandler';
import provider from '../../../../src/services/updateUserRole/provider';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/updateUserRole/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const userId = '123';
  const roleName = 'roleName';

  beforeEach(() => {
    req = { body: {} } as unknown as Request;
    res = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with the error when provider throws an error', async () => {
    const expectedError = new Error('err');

    res.locals = { userId, roleName };
    mockedProvider.mockRejectedValue(expectedError);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(userId, roleName);
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return user_id with 200 when provider returns user_id', async () => {
    res.locals = { userId, roleName };
    mockedProvider.mockResolvedValue(userId);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(userId, roleName);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith({ user_id: userId });
    expect(next).not.toBeCalled();
  });
});
