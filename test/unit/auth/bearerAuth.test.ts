jest.mock('../../../src/utils/jwt', () => ({
  verify: jest.fn(),
}));

import { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import auth, { IResLocals } from '../../../src/auth/bearerAuth';
import { AppError, errDef } from '../../../src/utils/errors';
import jwt from '../../../src/utils/jwt';

const mockedJwtVerify = jwt.verify as jest.Mock;

describe('Test /src/auth/bearerAuth', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Request;
    res = { locals: {} } as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with AuthorizationNotFound error when the authorization is not found', async () => {
    req.headers = {};

    await auth(req, res, next);

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new AppError(errDef[401].AuthorizationNotFound));
  });

  it('should call next with InvalidAuthScheme error when the authorization scheme is invalid', async () => {
    req.headers = { authorization: 'InvalidScheme token' };

    await auth(req, res, next);

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new AppError(errDef[401].InvalidAuthScheme));
  });

  it('should call next with AccessTokenNotFound error when the access token is not found', async () => {
    req.headers = { authorization: 'Bearer' };

    await auth(req, res, next);

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new AppError(errDef[401].AccessTokenNotFound));
  });

  it('should call next with AccessUndefined error when the accessRegex is not defined', async () => {
    const accessToken = 'valid-token';
    req.headers = { authorization: `Bearer ${accessToken}` };
    res.locals = {} as IResLocals;

    await auth(req, res, next);

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new AppError(errDef[403].AccessUndefined));
  });

  it('should call jwt.verify with the correct arguments and put the result in res.local and call next when the token is valid', async () => {
    const accessToken = 'valid-token';
    req.headers = { authorization: `Bearer ${accessToken}` };
    res.locals = { accessRegex: /.*/ } as IResLocals;
    const expectedPayload = { payload: 'payload' };

    mockedJwtVerify.mockImplementationOnce(() => expectedPayload);

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(jwt.verify).toHaveBeenCalledWith(accessToken, /.*/);
    expect(res.locals).toHaveProperty('decodedToken');
    expect(res.locals.decodedToken).toEqual(expectedPayload);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with TokenExpired error when the token is expired', async () => {
    const accessToken = 'expired-token';
    req.headers = { authorization: `Bearer ${accessToken}` };
    res.locals = { accessRegex: /.*/ } as IResLocals;
    const tokenExpiredError = new TokenExpiredError('Token expired', new Date());

    mockedJwtVerify.mockImplementationOnce(() => {
      throw tokenExpiredError;
    });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(jwt.verify).toHaveBeenCalledWith(accessToken, /.*/);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(
      new AppError(errDef[401].TokenExpired, { cause: tokenExpiredError.message }),
    );
  });

  it('should call next with AccessDenied error when the token has denied access', async () => {
    const accessToken = 'denied-access-token';
    req.headers = { authorization: `Bearer ${accessToken}` };
    res.locals = { accessRegex: /.*/ } as IResLocals;
    const deniedAccessError = new JsonWebTokenError('jwt audience invalid');

    mockedJwtVerify.mockImplementationOnce(() => {
      throw deniedAccessError;
    });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(jwt.verify).toHaveBeenCalledWith(accessToken, /.*/);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(
      new AppError(errDef[403].AccessDenied, { cause: deniedAccessError.message }),
    );
  });

  it('should call next with InvalidToken error when the token is invalid', async () => {
    const accessToken = 'invalid-token';
    req.headers = { authorization: `Bearer ${accessToken}` };
    res.locals = { accessRegex: /.*/ } as IResLocals;
    const invalidTokenError = new JsonWebTokenError('Invalid token');

    mockedJwtVerify.mockImplementationOnce(() => {
      throw invalidTokenError;
    });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(jwt.verify).toHaveBeenCalledWith(accessToken, /.*/);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(
      new AppError(errDef[401].InvalidToken, { cause: invalidTokenError.message }),
    );
  });

  it('should call next with the error when an unknown error occurs', async () => {
    const accessToken = 'unknown-error-token';
    req.headers = { authorization: `Bearer ${accessToken}` };
    res.locals = { accessRegex: /.*/ } as IResLocals;
    const unknownError = new Error('Unknown error');

    mockedJwtVerify.mockImplementationOnce(() => {
      throw unknownError;
    });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(jwt.verify).toHaveBeenCalledWith(accessToken, /.*/);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(unknownError);
  });
});
