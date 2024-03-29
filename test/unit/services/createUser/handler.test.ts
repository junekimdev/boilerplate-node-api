// Mocks
jest.mock('../../../../src/services/createUser/provider', () => jest.fn());
jest.mock('../../../../src/utils/email', () => ({ isEmailValid: jest.fn() }));

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/createUser/apiHandler';
import provider from '../../../../src/services/createUser/provider';
import { isEmailValid } from '../../../../src/utils/email';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;
const mockedEmailValidator = isEmailValid as jest.Mock;

// Tests
describe('Test /src/services/createUser/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const userId = 123;
  const email = 'test@example.com';
  const password = 'password';
  const roleName = 'user1';
  const surname = 'surname';
  const given_name = 'givenName';

  beforeEach(() => {
    req = { body: {} } as Request;
    res = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with InvalidEmailFormat error if email is invalid', async () => {
    const invalidEmail = 'invalid_email';
    const expectedError = new AppError(errDef[400].InvalidEmailFormat);

    req.body = { email: invalidEmail, password };
    res.locals = { roleName };
    mockedEmailValidator.mockReturnValue(false);

    await handler(req, res, next);

    expect(isEmailValid).toBeCalledWith(invalidEmail);
    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidEmailFormat error when password is not found', async () => {
    const expectedError = new AppError(errDef[400].invalidPassword);

    req.body = { email };
    res.locals = { roleName };
    mockedEmailValidator.mockReturnValue(true);

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidEmailFormat error when password is not a string', async () => {
    const expectedError = new AppError(errDef[400].invalidPassword);

    req.body = { email, password: 123 };
    res.locals = { roleName };
    mockedEmailValidator.mockReturnValue(true);

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidEmailFormat error when password is an empty string', async () => {
    const expectedError = new AppError(errDef[400].invalidPassword);

    req.body = { email, password: '' };
    res.locals = { roleName };
    mockedEmailValidator.mockReturnValue(true);

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with the error if provider throws an error', async () => {
    const expectedError = new Error('unknown error');

    req.body = { email, password };
    res.locals = { roleName };
    mockedEmailValidator.mockReturnValue(true);
    mockedProvider.mockRejectedValue(expectedError);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(email, password, roleName, '', '');
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should create a user and return user_id', async () => {
    req.body = { email, password };
    res.locals = { roleName };
    mockedEmailValidator.mockReturnValue(true);
    mockedProvider.mockResolvedValue(userId);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(email, password, roleName, '', '');
    expect(res.status).toBeCalledWith(201);
    expect(res.json).toBeCalledWith({ user_id: userId });
    expect(next).not.toBeCalled();
  });

  it('should create a user with additional info and return user_id', async () => {
    req.body = { email, password, surname, given_name };
    res.locals = { roleName };
    mockedEmailValidator.mockReturnValue(true);
    mockedProvider.mockResolvedValue(userId);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(email, password, roleName, surname, given_name);
    expect(res.status).toBeCalledWith(201);
    expect(res.json).toBeCalledWith({ user_id: userId });
    expect(next).not.toBeCalled();
  });
});
