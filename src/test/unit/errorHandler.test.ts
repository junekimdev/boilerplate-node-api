jest.mock('../../utils/logger');

const SERVICE_NAME = 'my_api';
process.env = { SERVICE_NAME };

import { NextFunction, Request, Response } from 'express';
import handler from '../../errorHandler';
import { AppError, errDef } from '../../utils/errors';
import { logger } from '../../utils/logger';

describe('Test /src/errorHandler', () => {
  const req = {
    app: { get: jest.fn() },
    method: 'GET',
    originalUrl: '/path',
    iup: '127.0.0.1',
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

  it('should handle errors correctly in development mode', () => {
    mockedReqAppGet.mockReturnValue('development');
    const error = new Error('test error');
    const log = `[${req.method} ${req.originalUrl}] from ${req.ip} | ${
      error.message
    } | ${JSON.stringify(error)}`;
    const expectedError: any = {};
    expectedError.status = 500;
    expectedError.code = 'ERROR';
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
    const log = `[${req.method} ${req.originalUrl}] from ${req.ip} | ${
      error.message
    } | ${JSON.stringify(error)}`;
    const expectedError: any = {};
    expectedError.status = error.status;
    expectedError.code = error.code;
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
    const log = `[${req.method} ${req.originalUrl}] from ${req.ip} | ${
      error.message
    } | ${JSON.stringify(error)}`;
    const expectedError: any = {};
    expectedError.status = error.status;
    expectedError.code = error.code;
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

  it('should handle 401 errors correctly for basic auth scheme', () => {
    mockedReqAppGet.mockReturnValue('development');
    const error = new AppError(errDef[401].AuthorizationNotFound);
    const log = `[${req.method} ${req.originalUrl}] from ${req.ip} | ${
      error.message
    } | ${JSON.stringify(error)}`;
    const msg401 = `Basic realm="${SERVICE_NAME}"`;
    const expectedError: any = {};
    expectedError.status = error.status;
    expectedError.code = error.code;
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

  it('should handle 401 errors correctly for bearer auth scheme', () => {
    mockedReqAppGet.mockReturnValue('development');
    const error = new AppError(errDef[401].AccessTokenNotFound);
    const log = `[${req.method} ${req.originalUrl}] from ${req.ip} | ${
      error.message
    } | ${JSON.stringify(error)}`;
    const msg401 = `Bearer realm="${SERVICE_NAME}"`;
    const expectedError: any = {};
    expectedError.status = error.status;
    expectedError.code = error.code;
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
