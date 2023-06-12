// Mocks
jest.mock('../../../../src/services/updateUserRole/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/updateUserRole/apiHandler';
import provider from '../../../../src/services/updateUserRole/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

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

  it('should call next with UserNotFound error when provider returns 0', async () => {
    const expectedError = new AppError(errDef[404].UserNotFound);

    res.locals = { userId, roleName };
    mockedProvider.mockResolvedValue(0);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(userId, roleName);
    expect(res.sendStatus).not.toBeCalledWith();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return 200 when provider returns 1', async () => {
    res.locals = { userId, roleName };
    mockedProvider.mockResolvedValue(1);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(userId, roleName);
    expect(res.sendStatus).toBeCalledWith(200);
    expect(next).not.toBeCalled();
  });
});
