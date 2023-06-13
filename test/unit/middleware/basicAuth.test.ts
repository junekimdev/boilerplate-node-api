jest.mock('../../../src/utils/db', () => ({
  query: jest.fn(),
}));
jest.mock('../../../src/utils/email', () => ({
  isEmailValid: jest.fn(),
}));
jest.mock('../../../src/utils/hash', () => ({
  passSalt: jest.fn(),
}));

import { NextFunction, Request, Response } from 'express';
import { QueryResult } from 'pg';
import auth, { decodeCredential } from '../../../src/middleware/basicAuth';
import db from '../../../src/utils/db';
import { isEmailValid } from '../../../src/utils/email';
import { AppError, errDef } from '../../../src/utils/errors';
import hash from '../../../src/utils/hash';

const mockedDbQuery = db.query as jest.Mock;
const mockedHashPass = hash.passSalt as jest.Mock;
const mockedIsEmailValid = isEmailValid as jest.Mock;

describe('Test /src/middleware/basicAuth', () => {
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

    expect(db.query).not.toBeCalled();
    expect(hash.passSalt).not.toBeCalled();
    expect(isEmailValid).not.toBeCalled();
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(new AppError(errDef[401].AuthorizationNotFound));
  });

  it('should call next with InvalidAuthScheme error when the authorization scheme is invalid', async () => {
    req.headers = { authorization: 'InvalidScheme credentials' };

    await auth(req, res, next);

    expect(db.query).not.toBeCalled();
    expect(hash.passSalt).not.toBeCalled();
    expect(isEmailValid).not.toBeCalled();
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(new AppError(errDef[401].InvalidAuthScheme));
  });

  it('should call next with UserCredentialNotFound error when user credential is not found', async () => {
    req.headers = { authorization: 'Basic' };

    await auth(req, res, next);

    expect(db.query).not.toBeCalled();
    expect(hash.passSalt).not.toBeCalled();
    expect(isEmailValid).not.toBeCalled();
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(new AppError(errDef[401].UserCredentialNotFound));
  });

  it('should call next with UserCredentialNotFound error when the password is not found in user credential', async () => {
    const credWithoutPassword = Buffer.from('test@example.com').toString('base64');

    req.headers = { authorization: `Basic ${credWithoutPassword}` };

    await auth(req, res, next);

    expect(db.query).not.toBeCalled();
    expect(hash.passSalt).not.toBeCalled();
    expect(isEmailValid).not.toBeCalled();
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(new AppError(errDef[401].UserCredentialNotFound));
  });

  it('should call next with InvalidEmailFormatAuth error when the email format is invalid', async () => {
    const email = 'test_example.com';
    const password = 'password';
    const cred = Buffer.from(`${email}:${password}`).toString('base64');

    req.headers = { authorization: `Basic ${cred}` };
    await auth(req, res, next);

    expect(db.query).not.toBeCalled();
    expect(hash.passSalt).not.toBeCalled();
    expect(isEmailValid).toBeCalledTimes(1);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(new AppError(errDef[400].InvalidEmailFormatAuth));
  });

  it('should call next with InvalidCredential error when the email is not found in the database', async () => {
    const email = 'test@example.com';
    const password = 'password';
    const validCred = Buffer.from(`${email}:${password}`).toString('base64');

    req.headers = { authorization: `Basic ${validCred}` };
    mockedIsEmailValid.mockReturnValue(true);
    mockedDbQuery.mockResolvedValue({ rowCount: 0 } as QueryResult);

    await auth(req, res, next);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [email]);
    expect(hash.passSalt).not.toBeCalled();
    expect(isEmailValid).toBeCalledTimes(1);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(new AppError(errDef[401].InvalidCredential));
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
    mockedHashPass.mockResolvedValue('wrong-password-hash');

    await auth(req, res, next);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [email]);
    expect(hash.passSalt).toBeCalledTimes(1);
    expect(hash.passSalt).toBeCalledWith(password, 'salt');
    expect(isEmailValid).toBeCalledTimes(1);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(new AppError(errDef[401].InvalidCredential));
  });

  it('should set res.locals with userId and email, and call next when the credentials are valid', async () => {
    const email = 'test@example.com';
    const password = 'password';
    const userId = 123;
    const validCred = Buffer.from(`${email}:${password}`).toString('base64');

    req.headers = { authorization: `Basic ${validCred}` };
    mockedIsEmailValid.mockReturnValue(true);
    mockedDbQuery.mockResolvedValue({
      rowCount: 1,
      rows: [{ id: userId, pw: 'hashed-password', salt: 'salt' }],
    } as QueryResult);
    mockedHashPass.mockResolvedValue('hashed-password');

    await auth(req, res, next);

    expect(db.query).toBeCalledTimes(2);
    expect(db.query).nthCalledWith(1, expect.any(String), [email]);
    expect(db.query).nthCalledWith(2, expect.any(String), [userId]);
    expect(hash.passSalt).toBeCalledTimes(1);
    expect(hash.passSalt).toBeCalledWith(password, 'salt');
    expect(isEmailValid).toBeCalledTimes(1);
    expect(res.locals.userId).toEqual(userId);
    expect(res.locals.email).toEqual(email);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith();
  });
});
