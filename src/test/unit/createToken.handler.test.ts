jest.mock('../../services/createToken/provider', () => jest.fn());

import { NextFunction, Request, Response } from 'express';
import handler from '../../services/createToken/apiHandler';
import provider from '../../services/createToken/provider';

// Helping functions
const mockedId = 123;
const mockedEmail = 'test@example.com';
const mockedToken = 'mockedToken';
const mockedRequest = (body: any = {}): Request => ({ body } as Request);
const mockedResponse = (): Response => {
  const res: Partial<Response> = {
    locals: {
      userId: mockedId,
      email: mockedEmail,
    },
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
    const req = mockedRequest();
    const res = mockedResponse();
    const next = mockedNext();
    const mockedResult = { access_token: mockedToken, refresh_token: mockedToken };

    mockedProvider.mockResolvedValue(mockedResult);

    await handler(req, res, next);

    expect(mockedProvider).toHaveBeenCalledWith(mockedId, mockedEmail);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockedResult);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with the error if provider throws an error', async () => {
    const req = mockedRequest();
    const res = mockedResponse();
    const next = mockedNext();
    const expectedError = new Error('Provider error');

    mockedProvider.mockRejectedValue(expectedError);

    await handler(req, res, next);

    expect(mockedProvider).toHaveBeenCalledWith(mockedId, mockedEmail);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expectedError);
  });
});
