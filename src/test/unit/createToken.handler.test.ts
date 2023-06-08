jest.mock('../../services/createToken/provider', () => jest.fn());

import { NextFunction, Request, Response } from 'express';
import handler from '../../services/createToken/apiHandler';
import provider from '../../services/createToken/provider';
import { AppError, errDef } from '../../utils/errors';

// Helping functions
const userId = 123;
const email = 'test@example.com';
const token = 'mockedToken';
const device = 'device_uuid';
const mockedRequest = (body: any = {}): Request => ({ body } as Request);
const mockedResponse = (): Response => {
  const res: Partial<Response> = {
    locals: { userId, email },
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as Response;
};
const mockedNext = () => jest.fn() as NextFunction;

// Test
describe('Test /src/services/createToken/apiHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockedProvider = provider as jest.Mock;

  it('should call provider and send the access token in the response body', async () => {
    const req = mockedRequest({ device });
    const res = mockedResponse();
    const next = mockedNext();
    const mockedResult = { access_token: token, refresh_token: token };

    mockedProvider.mockResolvedValue(mockedResult);

    await handler(req, res, next);

    expect(mockedProvider).toHaveBeenCalledWith(userId, email, device);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockedResult);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with DeviceIdNotFound error if there is no device id in request body', async () => {
    const req = mockedRequest();
    const res = mockedResponse();
    const next = mockedNext();
    const expectedError = new AppError(errDef[400].DeviceIdNotFound);

    await handler(req, res, next);

    expect(mockedProvider).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should call next with InvalidDeviceId error if device id in request body is not a string', async () => {
    const req = mockedRequest({ device: { id: 'device' } });
    const res = mockedResponse();
    const next = mockedNext();
    const expectedError = new AppError(errDef[400].InvalidDeviceId);

    await handler(req, res, next);

    expect(mockedProvider).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should call next with the error if provider throws an error', async () => {
    const req = mockedRequest({ device });
    const res = mockedResponse();
    const next = mockedNext();
    const expectedError = new Error('Provider error');

    mockedProvider.mockRejectedValue(expectedError);

    await handler(req, res, next);

    expect(mockedProvider).toHaveBeenCalledWith(userId, email, device);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expectedError);
  });
});
