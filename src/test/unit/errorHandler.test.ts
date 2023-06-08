jest.mock('../../utils/logger');

import { NextFunction, Request, Response } from 'express';
import handler, { getErrorLog } from '../../errorHandler';
import { AppError, errDef } from '../../utils/errors';
import { logger } from '../../utils/logger';

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
      mockedReqAppGet.mockReturnValue('development');
      const error = new Error('test error');
      const log = getErrorLog(req, error);
      const expectedError: any = {};
      expectedError.status = 500;
      expectedError.message = error.message;
      expectedError.error = error;

      handler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(log);
      expect(res.set).not.toHaveBeenCalled();
      expect(req.app.get).toHaveBeenCalledTimes(1);
      expect(req.app.get).toHaveBeenCalledWith('env');
      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(expectedError.status);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(expectedError);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle AppErrors correctly in development mode', () => {
      mockedReqAppGet.mockReturnValue('development');
      const error = new AppError(errDef[400].InvalidEmailFormat);
      const log = getErrorLog(req, error);
      const expectedError: any = {};
      expectedError.status = error.status;
      expectedError.message = error.message;
      expectedError.error = error;

      handler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(log);
      expect(res.set).not.toHaveBeenCalled();
      expect(req.app.get).toHaveBeenCalledTimes(1);
      expect(req.app.get).toHaveBeenCalledWith('env');
      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(expectedError.status);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(expectedError);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle errors correctly in production mode', () => {
      mockedReqAppGet.mockReturnValue('production');
      const error = new AppError();
      const log = getErrorLog(req, error);
      const expectedError: any = {};
      expectedError.status = error.status;
      expectedError.message = error.message;

      handler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(log);
      expect(res.set).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(expectedError.status);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(expectedError);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle 401 errors related to basic auth scheme correctly', () => {
      mockedReqAppGet.mockReturnValue('development');
      const error = new AppError(errDef[401].AuthorizationNotFound);
      const log = getErrorLog(req, error);
      const msg401 = `Basic realm="${req.headers.host}"`;
      const expectedError: any = {};
      expectedError.status = error.status;
      expectedError.message = error.message;
      expectedError.error = error;

      handler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(log);
      expect(res.set).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith('WWW-Authenticate', msg401);
      expect(req.app.get).toHaveBeenCalledTimes(1);
      expect(req.app.get).toHaveBeenCalledWith('env');
      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(expectedError.status);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(expectedError);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle 401 errors related to auth scheme and non-token-validity correctly', () => {
      mockedReqAppGet.mockReturnValue('development');
      const error = new AppError(errDef[401].AccessTokenNotFound);
      const log = getErrorLog(req, error);
      const msg401 = `Bearer realm="${req.headers.host}"`;
      const expectedError: any = {};
      expectedError.status = error.status;
      expectedError.message = error.message;
      expectedError.error = error;

      handler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(log);
      expect(res.set).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith('WWW-Authenticate', msg401);
      expect(req.app.get).toHaveBeenCalledTimes(1);
      expect(req.app.get).toHaveBeenCalledWith('env');
      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(expectedError.status);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(expectedError);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle 401 errors related to invalid tokens correctly', () => {
      mockedReqAppGet.mockReturnValue('development');
      const error = new AppError(errDef[401].InvalidToken);
      const log = getErrorLog(req, error);
      const msg401 = `Bearer realm="${req.headers.host}", error="invalid_token", error_description="${error.message}"`;
      const expectedError: any = {};
      expectedError.status = error.status;
      expectedError.message = error.message;
      expectedError.error = error;

      handler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(log);
      expect(res.set).toHaveBeenCalledTimes(1);
      expect(res.set).toHaveBeenCalledWith('WWW-Authenticate', msg401);
      expect(req.app.get).toHaveBeenCalledTimes(1);
      expect(req.app.get).toHaveBeenCalledWith('env');
      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(expectedError.status);
      expect(res.json).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(expectedError);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
