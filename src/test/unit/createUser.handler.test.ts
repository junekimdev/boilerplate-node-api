// Mocks
const mockErrdef = {
  400: { InvalidEmailFormat: 'InvalidEmailFormat' },
  406: { EmailTooLong: 'EmailTooLong' },
};
jest.mock('../../utils', () => ({
  isEmailValid: jest.fn(),
  AppError: jest.fn((msg: string) => new Error(msg)),
  errDef: mockErrdef,
}));

jest.mock('../../services/createUser/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../services/createUser/apiHandler';
import provider from '../../services/createUser/provider';
import { AppError, errDef, isEmailValid } from '../../utils';

// Helping functions
const mockedRequest = (body: any = {}): Request => ({ body } as Request);
const mockedResponse = (): Response => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as Response;
};
const mockedNext = () => jest.fn() as NextFunction;

// Tests
describe('Test /src/services/createUser/apiHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should provide user and return 201 status with user_id in the response', async () => {
    const email = 'test@example.com';
    const password = 'password';
    const req = mockedRequest({ email, password });
    const res = mockedResponse();
    const next = mockedNext();
    const userId = 123;

    (isEmailValid as jest.Mock).mockReturnValue(true);
    (provider as jest.Mock).mockResolvedValue(userId);

    await handler(req, res, next);

    expect(isEmailValid).toHaveBeenCalledWith(email);
    expect(provider).toHaveBeenCalledWith(email, password);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user_id: userId });
    expect(next).not.toHaveBeenCalled();
  });

  it('should throw AppError with 400 status if email is invalid', async () => {
    const email = 'invalid_email';
    const password = 'password';
    const req = mockedRequest({ email, password });
    const res = mockedResponse();
    const next = mockedNext();
    const expectedError = new Error(mockErrdef[400].InvalidEmailFormat);

    (isEmailValid as jest.Mock).mockReturnValue(false);

    await handler(req, res, next);

    expect(isEmailValid).toHaveBeenCalledWith(email);
    expect(provider).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should throw AppError with 406 status if email is too long', async () => {
    const email = 'a'.repeat(51);
    const password = 'password';
    const req = mockedRequest({ email, password });
    const res = mockedResponse();
    const next = mockedNext();
    const expectedError = new Error(mockErrdef[406].EmailTooLong);

    (isEmailValid as jest.Mock).mockReturnValue(true);

    await handler(req, res, next);

    expect(isEmailValid).toHaveBeenCalledWith(email);
    expect(provider).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should pass error to the next middleware if an error occurs', async () => {
    const email = 'test@example.com';
    const password = 'password';
    const req = mockedRequest({ email, password });
    const res = mockedResponse();
    const next = mockedNext();
    const expectedError = new Error('Database connection error');

    (isEmailValid as jest.Mock).mockReturnValue(true);
    (provider as jest.Mock).mockRejectedValue(expectedError);

    await handler(req, res, next);

    expect(isEmailValid).toHaveBeenCalledWith(email);
    expect(provider).toHaveBeenCalledWith(email, password);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expectedError);
  });
});
