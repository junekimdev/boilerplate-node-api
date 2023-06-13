// Mocks
jest.mock('../../../../src/services/updateUserPwd/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/updateUserPwd/apiHandler';
import provider from '../../../../src/services/updateUserPwd/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/updateUserPwd/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  const userId = 123;
  const password = 'password';

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

  it('should call next with invalidPassword error when the new password is not found', async () => {
    const expectedError = new AppError(errDef[400].invalidPassword);

    res.locals = { userId };
    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.sendStatus).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with invalidPassword error when the new password is not a string', async () => {
    const expectedError = new AppError(errDef[400].invalidPassword);

    res.locals = { userId };
    req.body = { password: 123 };
    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.sendStatus).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with invalidPassword error when the new password is an empty string', async () => {
    const expectedError = new AppError(errDef[400].invalidPassword);

    res.locals = { userId };
    req.body = { password: '' };
    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.sendStatus).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with UserNotFound error when provider returns 0', async () => {
    const expectedError = new AppError(errDef[404].UserNotFound);

    res.locals = { userId };
    req.body = { password };
    mockedProvider.mockResolvedValue(0);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(userId, password);
    expect(res.sendStatus).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return 200 when provider returns 1', async () => {
    res.locals = { userId };
    req.body = { password };
    mockedProvider.mockResolvedValue(1);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(userId, password);
    expect(res.sendStatus).toBeCalledWith(200);
    expect(next).not.toBeCalled();
  });
});
