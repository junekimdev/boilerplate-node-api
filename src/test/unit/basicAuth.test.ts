jest.mock('../../utils/db', () => ({
  query: jest.fn(),
}));
jest.mock('../../utils/email', () => ({
  isEmailValid: jest.fn(),
}));
jest.mock('../../utils/hash', () => ({
  sha256: jest.fn(),
}));

import { NextFunction, Request, Response } from 'express';
import { QueryResult } from 'pg';
import auth, { decodeCredential } from '../../auth/basicAuth';
import db from '../../utils/db';
import { isEmailValid } from '../../utils/email';
import { AppError, errDef } from '../../utils/errors';
import hash from '../../utils/hash';

const mockedDbQuery = db.query as jest.Mock;
const mockedHashSha256 = hash.sha256 as jest.Mock;
const mockedIsEmailValid = isEmailValid as jest.Mock;

describe('Test /src/auth/basicAuth', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Request;
    res = { locals: {} } as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with AuthorizationNotFound error when there is no authorization in header', async () => {
    req.headers = {};

    await auth(req, res, next);

    expect(mockedDbQuery).not.toHaveBeenCalled();
    expect(mockedHashSha256).not.toHaveBeenCalled();
    expect(mockedIsEmailValid).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new AppError(errDef[401].AuthorizationNotFound));
  });

  it('should call next with InvalidAuthScheme error when the authorization scheme is invalid', async () => {
    req.headers = { authorization: 'InvalidScheme credentials' };

    await auth(req, res, next);

    expect(mockedDbQuery).not.toHaveBeenCalled();
    expect(mockedHashSha256).not.toHaveBeenCalled();
    expect(mockedIsEmailValid).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new AppError(errDef[401].InvalidAuthScheme));
  });

  it('should call next with UserCredentialNotFound error when user credential is not found', async () => {
    req.headers = { authorization: 'Basic' };

    await auth(req, res, next);

    expect(mockedDbQuery).not.toHaveBeenCalled();
    expect(mockedHashSha256).not.toHaveBeenCalled();
    expect(mockedIsEmailValid).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new AppError(errDef[401].UserCredentialNotFound));
  });

  it('should call next with UserCredentialNotFound error when the password is not found in user credential', async () => {
    const credWithoutPassword = Buffer.from('test@example.com').toString('base64');
    req.headers = { authorization: `Basic ${credWithoutPassword}` };

    await auth(req, res, next);

    expect(mockedDbQuery).not.toHaveBeenCalled();
    expect(mockedHashSha256).not.toHaveBeenCalled();
    expect(mockedIsEmailValid).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new AppError(errDef[401].UserCredentialNotFound));
  });

  it('should call next with InvalidEmailFormat error when the email format is invalid', async () => {
    const email = 'test_example.com';
    const password = 'password';
    const cred = Buffer.from(`${email}:${password}`).toString('base64');
    req.headers = { authorization: `Basic ${cred}` };

    await auth(req, res, next);

    expect(mockedDbQuery).not.toHaveBeenCalled();
    expect(mockedHashSha256).not.toHaveBeenCalled();
    expect(mockedIsEmailValid).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new AppError(errDef[400].InvalidEmailFormat));
  });

  it('should call next with InvalidCredential error when the email is not found in the database', async () => {
    const email = 'test@example.com';
    const password = 'password';
    const validCred = Buffer.from(`${email}:${password}`).toString('base64');
    req.headers = { authorization: `Basic ${validCred}` };

    mockedIsEmailValid.mockReturnValue(true);
    mockedDbQuery.mockResolvedValue({ rowCount: 0 } as QueryResult);

    await auth(req, res, next);

    expect(mockedDbQuery).toHaveBeenCalledTimes(1);
    expect(mockedDbQuery).toHaveBeenCalledWith(expect.any(String), [email]);
    expect(mockedHashSha256).not.toHaveBeenCalled();
    expect(mockedIsEmailValid).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new AppError(errDef[401].InvalidCredential));
  });

  it('should call next with InvalidCredential error when the password is incorrect', async () => {
    const email = 'test@example.com';
    const password = 'password';
    const validCred = Buffer.from(`${email}:${password}`).toString('base64');
    req.headers = { authorization: `Basic ${validCred}` };

    mockedIsEmailValid.mockReturnValue(true);
    mockedDbQuery.mockResolvedValue({
      rowCount: 1,
      rows: [{ id: 1, pw: 'hashed-password', salt: 'salt' }],
    } as QueryResult);
    mockedHashSha256.mockResolvedValue('wrong-password-hash');

    await auth(req, res, next);

    expect(mockedDbQuery).toHaveBeenCalledTimes(1);
    expect(mockedDbQuery).toHaveBeenCalledWith(expect.any(String), [email]);
    expect(mockedHashSha256).toHaveBeenCalledTimes(1);
    expect(mockedHashSha256).toHaveBeenCalledWith(password + 'salt');
    expect(mockedIsEmailValid).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new AppError(errDef[401].InvalidCredential));
  });

  it('should set res.locals with userId and email, and call next when the credentials are valid', async () => {
    const email = 'test@example.com';
    const password = 'password';
    const validCred = Buffer.from(`${email}:${password}`).toString('base64');
    req.headers = { authorization: `Basic ${validCred}` };

    mockedIsEmailValid.mockReturnValue(true);
    mockedDbQuery.mockResolvedValue({
      rowCount: 1,
      rows: [{ id: 1, pw: 'hashed-password', salt: 'salt' }],
    } as QueryResult);
    mockedHashSha256.mockResolvedValue('hashed-password');

    await auth(req, res, next);

    expect(mockedDbQuery).toHaveBeenCalledTimes(2);
    expect(mockedDbQuery).toHaveBeenNthCalledWith(1, expect.any(String), [email]);
    expect(mockedDbQuery).toHaveBeenNthCalledWith(2, expect.any(String), [email]);
    expect(mockedHashSha256).toHaveBeenCalledTimes(1);
    expect(mockedHashSha256).toHaveBeenCalledWith(password + 'salt');
    expect(mockedIsEmailValid).toHaveBeenCalledTimes(1);
    expect(res.locals.userId).toEqual(1);
    expect(res.locals.email).toEqual(email);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});
