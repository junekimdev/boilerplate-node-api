// Imports
import { NextFunction, Request, Response } from 'express';
import validateUserIdAdmin from '../../../src/middleware/validateUserIdAdmin';
import { AppError, errDef } from '../../../src/utils/errors';

// Tests
describe('Test /src/middleware/validateUserIdAdmin', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = { body: {} } as unknown as Request;
    res = { locals: {} } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should put userId in res.locals and call next when user_id in req.body is a number', async () => {
    req.body = { user_id: 123 };

    await validateUserIdAdmin(req, res, next);

    expect(res.locals).toHaveProperty('userId');
    expect(next).toBeCalledWith();
  });

  it('should call next with InvalidUserId error when user_id in req.body is not a number', async () => {
    const expectedError = new AppError(errDef[400].InvalidUserId);

    req.body = { user_id: '123' };

    await validateUserIdAdmin(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with AppError when decodedToken is not in res.locals', async () => {
    const expectedError = new AppError();

    res.locals = {};

    await validateUserIdAdmin(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidToken error when user_id is not a number', async () => {
    const expectedError = new AppError(errDef[401].InvalidToken);

    res.locals = { decodedToken: { user_id: '123' } };

    await validateUserIdAdmin(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });

  it('should set userId in res.locals from decodedToken if user_id is not in req.body', async () => {
    res.locals = { decodedToken: { user_id: 123 } };

    await validateUserIdAdmin(req, res, next);

    expect(res.locals).toHaveProperty('userId');
    expect(next).toBeCalledWith();
  });
});
