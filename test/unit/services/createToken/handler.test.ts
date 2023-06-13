// Mocks
jest.mock('../../../../src/services/createToken/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/createToken/apiHandler';
import provider from '../../../../src/services/createToken/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Test
describe('Test /src/services/createToken/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const userId = 123;
  const email = 'test@example.com';
  const token = 'mockedToken';
  const device = 'device_uuid';

  beforeEach(() => {
    req = { body: {} } as Request;
    res = {
      locals: { userId, email },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call provider and send the access token in the response body', async () => {
    const mockedResult = { access_token: token, refresh_token: token };

    req.body = { device };
    mockedProvider.mockResolvedValue(mockedResult);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(userId, email, device);
    expect(res.status).toBeCalledWith(201);
    expect(res.json).toBeCalledWith(mockedResult);
    expect(next).not.toBeCalled();
  });

  it('should call next with DeviceIdNotFound error if there is no device id in request body', async () => {
    const expectedError = new AppError(errDef[400].InvalidDeviceId);

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidDeviceId error if device id in request body is not a string', async () => {
    const expectedError = new AppError(errDef[400].InvalidDeviceId);

    req.body = { device: 1 };

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with the error if provider throws an error', async () => {
    const expectedError = new Error('Provider error');

    req.body = { device };
    mockedProvider.mockRejectedValue(expectedError);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(userId, email, device);
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });
});
