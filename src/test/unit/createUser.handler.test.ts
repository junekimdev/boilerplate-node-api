// Mocks
jest.mock('../../utils/db', () => ({
  query: jest.fn(),
}));
jest.mock('../../utils/email', () => ({
  isEmailValid: jest.fn(),
}));

jest.mock('../../services/createUser/provider', () => jest.fn());

const mockedRequest = (body: any = {}): Request => ({ body } as Request);
const mockedResponse = (): Response => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as Response;
};
const mockedNext = () => jest.fn() as NextFunction;

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../services/createUser/apiHandler';
import provider from '../../services/createUser/provider';
import db from '../../utils/db';
import { isEmailValid } from '../../utils/email';
import { AppError, errDef } from '../../utils/errors';

const mockedProvider = provider as jest.Mock;
const mockedEmailValidator = isEmailValid as jest.Mock;
const mockedQuery = db.query as jest.Mock;

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

    mockedEmailValidator.mockReturnValue(true);
    mockedQuery.mockReturnValue({ rowCount: 0 });
    mockedProvider.mockResolvedValue(userId);

    await handler(req, res, next);

    expect(isEmailValid).toHaveBeenCalledWith(email);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [email]);
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
    const expectedError = new AppError(errDef[400].InvalidEmailFormat);

    mockedEmailValidator.mockReturnValue(false);
    mockedQuery.mockReturnValue({ rowCount: 0 });

    await handler(req, res, next);

    expect(isEmailValid).toHaveBeenCalledWith(email);
    expect(db.query).not.toHaveBeenCalled();
    expect(provider).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should throw AppError with 409 status if email already exists', async () => {
    const email = 'invalid_email';
    const password = 'password';
    const req = mockedRequest({ email, password });
    const res = mockedResponse();
    const next = mockedNext();
    const expectedError = new AppError(errDef[409].UserAlreadyExists);

    mockedEmailValidator.mockReturnValue(true);
    mockedQuery.mockReturnValue({ rowCount: 1 });

    await handler(req, res, next);

    expect(isEmailValid).toHaveBeenCalledWith(email);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [email]);
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

    mockedEmailValidator.mockReturnValue(true);
    mockedQuery.mockReturnValue({ rowCount: 0 });
    mockedProvider.mockRejectedValue(expectedError);

    await handler(req, res, next);

    expect(isEmailValid).toHaveBeenCalledWith(email);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), [email]);
    expect(provider).toHaveBeenCalledWith(email, password);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expectedError);
  });
});
