// Imports
import { NextFunction, Request, Response } from 'express';
import validateUserIdUser from '../../../src/middleware/validateUserIdUser';
import { AppError, errDef } from '../../../src/utils/errors';

// Tests
describe('Test /src/middleware/validateUserIdUser', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = { body: {} } as unknown as Request;
    res = { locals: {} } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should delete when user_id exists is in req.body ', async () => {
    req.body = { user_id: 123 };
    res.locals = { decodedToken: { user_id: 123 } };

    await validateUserIdUser(req, res, next);

    expect(req.body).not.toHaveProperty('userId');
    expect(next).toBeCalledWith();
  });

  it('should set userId in res.locals from decodedToken', async () => {
    res.locals = { decodedToken: { user_id: 123 } };

    await validateUserIdUser(req, res, next);

    expect(res.locals).toHaveProperty('userId');
    expect(next).toBeCalledWith();
  });

  it('should call next with AppError when decodedToken is not in res.locals', async () => {
    const expectedError = new AppError();

    res.locals = {};

    await validateUserIdUser(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidToken error when user_id is not a number', async () => {
    const expectedError = new AppError(errDef[401].InvalidToken);

    res.locals = { decodedToken: { user_id: '123' } };

    await validateUserIdUser(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });
});
