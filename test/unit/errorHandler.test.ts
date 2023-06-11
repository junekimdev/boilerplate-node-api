jest.mock('../../src/utils/logger');

import { NextFunction, Request, Response } from 'express';
import handler, { getErrorLog } from '../../src/errorHandler';
import { AppError, errDef } from '../../src/utils/errors';
import { logger } from '../../src/utils/logger';

describe('Test /src/errorHandler', () => {
  const req = {
    app: { get: jest.fn() },
    method: 'GET',
    originalUrl: '/path',
    ip: '127.0.0.1',
    headers: { host: 'localhost:3000' },
  } as unknown as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    set: jest.fn(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  const mockedReqAppGet = req.app?.get as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getErrorLog()', () => {
    it('should return error log strings correctly when there is no cause property in error', () => {
      const error = new Error('test error');
      const expected = `[${req.method} ${req.originalUrl}] from ${req.ip} to ${req.headers.host} | ${error.message}`;

      const result = getErrorLog(req, error);

      expect(result).toBe(expected);
    });

    it('should return error log strings correctly when there is cause property in error', () => {
      const originalError = new Error('original error');
      const error = new Error('test error', { cause: originalError });
      const expected = `[${req.method} ${req.originalUrl}] from ${req.ip} to ${
        req.headers.host
      } | ${error.message} ${JSON.stringify(originalError)}`;

      const result = getErrorLog(req, error);

      expect(result).toBe(expected);
    });
  });

  describe('handler', () => {
    it('should handle errors correctly in development mode', () => {
      const error = new Error('test error');
      const log = getErrorLog(req, error);
      const expectedError = {
        status: 500,
        message: error.message,
        error,
      };

      mockedReqAppGet.mockReturnValue('development');

      handler(error, req, res, next);

      expect(logger.error).toBeCalledTimes(1);
      expect(logger.error).toBeCalledWith(log);
      expect(res.set).not.toBeCalled();
      expect(req.app.get).toBeCalledTimes(1);
      expect(req.app.get).toBeCalledWith('env');
      expect(res.status).toBeCalledTimes(1);
      expect(res.status).toBeCalledWith(expectedError.status);
      expect(res.json).toBeCalledTimes(1);
      expect(res.json).toBeCalledWith(expectedError);
      expect(next).toBeCalledTimes(1);
    });

    it('should handle AppErrors correctly in development mode', () => {
      const error = new AppError(errDef[400].InvalidEmailFormat);
      const log = getErrorLog(req, error);
      const expectedError = {
        status: error.status,
        message: error.message,
        error,
      };

      mockedReqAppGet.mockReturnValue('development');

      handler(error, req, res, next);

      expect(logger.error).toBeCalledTimes(1);
      expect(logger.error).toBeCalledWith(log);
      expect(res.set).not.toBeCalled();
      expect(req.app.get).toBeCalledTimes(1);
      expect(req.app.get).toBeCalledWith('env');
      expect(res.status).toBeCalledTimes(1);
      expect(res.status).toBeCalledWith(expectedError.status);
      expect(res.json).toBeCalledTimes(1);
      expect(res.json).toBeCalledWith(expectedError);
      expect(next).toBeCalledTimes(1);
    });

    it('should handle errors correctly in production mode', () => {
      const error = new AppError();
      const log = getErrorLog(req, error);
      const expectedError = {
        status: error.status,
        message: error.message,
      };

      mockedReqAppGet.mockReturnValue('production');

      handler(error, req, res, next);

      expect(logger.error).toBeCalledTimes(1);
      expect(logger.error).toBeCalledWith(log);
      expect(res.set).not.toBeCalled();
      expect(res.status).toBeCalledTimes(1);
      expect(res.status).toBeCalledWith(expectedError.status);
      expect(res.json).toBeCalledTimes(1);
      expect(res.json).toBeCalledWith(expectedError);
      expect(next).toBeCalledTimes(1);
    });

    it('should handle 401 errors related to basic auth scheme correctly', () => {
      const error = new AppError(errDef[401].AuthorizationNotFound);
      const log = getErrorLog(req, error);
      const msg401 = `Basic realm="${req.headers.host}"`;
      const expectedError = {
        status: error.status,
        message: error.message,
        error,
      };

      mockedReqAppGet.mockReturnValue('development');

      handler(error, req, res, next);

      expect(logger.error).toBeCalledTimes(1);
      expect(logger.error).toBeCalledWith(log);
      expect(res.set).toBeCalledTimes(1);
      expect(res.set).toBeCalledWith('WWW-Authenticate', msg401);
      expect(req.app.get).toBeCalledTimes(1);
      expect(req.app.get).toBeCalledWith('env');
      expect(res.status).toBeCalledTimes(1);
      expect(res.status).toBeCalledWith(expectedError.status);
      expect(res.json).toBeCalledTimes(1);
      expect(res.json).toBeCalledWith(expectedError);
      expect(next).toBeCalledTimes(1);
    });

    it('should handle 401 errors related to auth scheme and non-token-validity correctly', () => {
      const error = new AppError(errDef[401].AccessTokenNotFound);
      const log = getErrorLog(req, error);
      const msg401 = `Bearer realm="${req.headers.host}"`;
      const expectedError: any = {};
      expectedError.status = error.status;
      expectedError.message = error.message;
      expectedError.error = error;

      mockedReqAppGet.mockReturnValue('development');

      handler(error, req, res, next);

      expect(logger.error).toBeCalledTimes(1);
      expect(logger.error).toBeCalledWith(log);
      expect(res.set).toBeCalledTimes(1);
      expect(res.set).toBeCalledWith('WWW-Authenticate', msg401);
      expect(req.app.get).toBeCalledTimes(1);
      expect(req.app.get).toBeCalledWith('env');
      expect(res.status).toBeCalledTimes(1);
      expect(res.status).toBeCalledWith(expectedError.status);
      expect(res.json).toBeCalledTimes(1);
      expect(res.json).toBeCalledWith(expectedError);
      expect(next).toBeCalledTimes(1);
    });

    it('should handle 401 errors related to invalid tokens correctly', () => {
      const error = new AppError(errDef[401].InvalidToken);
      const log = getErrorLog(req, error);
      const msg401 = `Bearer realm="${req.headers.host}", error="invalid_token", error_description="${error.message}"`;
      const expectedError: any = {};
      expectedError.status = error.status;
      expectedError.message = error.message;
      expectedError.error = error;

      mockedReqAppGet.mockReturnValue('development');

      handler(error, req, res, next);

      expect(logger.error).toBeCalledTimes(1);
      expect(logger.error).toBeCalledWith(log);
      expect(res.set).toBeCalledTimes(1);
      expect(res.set).toBeCalledWith('WWW-Authenticate', msg401);
      expect(req.app.get).toBeCalledTimes(1);
      expect(req.app.get).toBeCalledWith('env');
      expect(res.status).toBeCalledTimes(1);
      expect(res.status).toBeCalledWith(expectedError.status);
      expect(res.json).toBeCalledTimes(1);
      expect(res.json).toBeCalledWith(expectedError);
      expect(next).toBeCalledTimes(1);
    });
  });
});
