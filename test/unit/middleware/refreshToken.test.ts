// Mocks
jest.mock('../../../src/utils/db', () => ({ query: jest.fn() }));
jest.mock('../../../src/utils/hash', () => ({ sha256: jest.fn() }));
jest.mock('../../../src/utils/jwt', () => ({ verify: jest.fn() }));

import { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import auth, { TokenRow } from '../../../src/auth/refreshToken';
import db from '../../../src/utils/db';
import { AppError, errDef } from '../../../src/utils/errors';
import hash from '../../../src/utils/hash';
import jwt from '../../../src/utils/jwt';

const mockedDbQuery = db.query as jest.Mock;
const mockedHashSha256 = hash.sha256 as jest.Mock;
const mockedJwtVerify = jwt.verify as jest.Mock;

describe('Test /src/auth/bearerAuth', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const user_id = 123;
  const email = 'test@email.com';
  const sub = email;
  const device = 'deviceId1234';
  const refresh_token = 'refreshToken';
  const tokenRow: TokenRow = { token: 'tokenInDB' };

  beforeEach(() => {
    req = { body: { refresh_token, device } } as Request;
    res = { locals: {} } as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with RefreshTokenNotFound error when no refresh token found in req body', async () => {
    const expectedError = new AppError(errDef[401].RefreshTokenNotFound);

    req.body = {};

    await auth(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidToken error when refresh token is not string', async () => {
    const invalidToken = 1;
    const expectedError = new AppError(errDef[401].InvalidToken);

    req.body = { refresh_token: invalidToken };

    await auth(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });

  it('should call jwt.verify', async () => {
    await auth(req, res, next);

    expect(jwt.verify).toBeCalledWith(refresh_token, 'refresh');
  });

  it('should call next with TokenExpired error when refresh token is expired', async () => {
    const tokenExpiredError = new TokenExpiredError('Token expired', new Date());
    const expectedError = new AppError(errDef[401].TokenExpired, {
      cause: tokenExpiredError.message,
    });

    mockedJwtVerify.mockRejectedValue(tokenExpiredError);

    await auth(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidToken error when refresh token is invalid', async () => {
    const invalidTokenError = new JsonWebTokenError('Invalid token');
    const expectedError = new AppError(errDef[401].InvalidToken, {
      cause: invalidTokenError.message,
    });

    mockedJwtVerify.mockRejectedValue(invalidTokenError);

    await auth(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidToken error when user_id in payload is not a number', async () => {
    const expectedError = new AppError(errDef[401].InvalidToken);

    mockedJwtVerify.mockResolvedValue({ user_id: '123', device, sub });

    await auth(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidToken error when device in payload is not a string', async () => {
    const expectedError = new AppError(errDef[401].InvalidToken);

    mockedJwtVerify.mockResolvedValue({ user_id, device: 123, sub });

    await auth(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidToken error when sub in payload is not a string', async () => {
    const expectedError = new AppError(errDef[401].InvalidToken);

    mockedJwtVerify.mockResolvedValue({ user_id, device, sub: 123 });

    await auth(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });

  it('should hash refreshToken', async () => {
    mockedJwtVerify.mockResolvedValue({ user_id, device, sub });
    mockedHashSha256.mockResolvedValue(tokenRow.token);
    mockedDbQuery.mockResolvedValue({ rowCount: 1, rows: [tokenRow] });

    await auth(req, res, next);

    expect(hash.sha256).toBeCalledWith(refresh_token);
  });

  it('should get refreshToken from DB', async () => {
    mockedJwtVerify.mockResolvedValue({ user_id, device, sub });
    mockedHashSha256.mockResolvedValue(tokenRow.token);
    mockedDbQuery.mockResolvedValue({ rowCount: 1, rows: [tokenRow] });

    await auth(req, res, next);

    expect(db.query).toBeCalledWith(expect.any(String), [user_id, device]);
  });

  it('should call next with InvalidToken error when no token found in DB with given IDs', async () => {
    const expectedError = new AppError(errDef[401].InvalidToken);

    mockedJwtVerify.mockResolvedValue({ user_id, device, sub });
    mockedHashSha256.mockResolvedValue(tokenRow.token);
    mockedDbQuery.mockResolvedValue({ rowCount: 0 });

    await auth(req, res, next);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).nthCalledWith(1, expect.any(String), [user_id, device]);
    expect(next).toBeCalledWith(expectedError);
  });

  it('should delete token in DB and return null if two refreshTokens are not the same', async () => {
    const hashed = 'differentToken';
    const expectedError = new AppError(errDef[401].InvalidToken);

    mockedJwtVerify.mockResolvedValue({ user_id, device, sub });
    mockedHashSha256.mockResolvedValue(hashed);
    mockedDbQuery.mockResolvedValue({ rowCount: 1, rows: [tokenRow] });

    await auth(req, res, next);

    expect(db.query).toBeCalledTimes(2);
    expect(db.query).nthCalledWith(1, expect.any(String), [user_id, device]);
    expect(db.query).nthCalledWith(2, expect.any(String), [user_id, device]);
    expect(next).toBeCalledWith(expectedError);
  });

  it('should set device in req.body and user_id and email in res.locals when two refreshTokens are the same', async () => {
    mockedJwtVerify.mockResolvedValue({ user_id, device, sub });
    mockedHashSha256.mockResolvedValue(tokenRow.token);
    mockedDbQuery.mockResolvedValue({ rowCount: 1, rows: [tokenRow] });

    await auth(req, res, next);

    expect(req.body).toHaveProperty('device');
    expect(res.locals).toHaveProperty('userId');
    expect(res.locals).toHaveProperty('email');
  });
});
