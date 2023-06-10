// Mocks
jest.mock('../../../../src/services/createUser/provider', () => jest.fn());
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));
jest.mock('../../../../src/utils/email', () => ({ isEmailValid: jest.fn() }));

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/createUser/apiHandler';
import provider from '../../../../src/services/createUser/provider';
import db from '../../../../src/utils/db';
import { isEmailValid } from '../../../../src/utils/email';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;
const mockedEmailValidator = isEmailValid as jest.Mock;
const mockedQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/createUser/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  const email = 'test@example.com';
  const password = 'password';
  const role = 'user1';
  const userId = 123;

  beforeEach(() => {
    req = { body: {}, params: {} } as Request;
    res = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with invalidRoleName error if role is invalid', async () => {
    const invalidRole = 'invalidRole';
    const expectedError = new AppError(errDef[400].invalidRoleName);

    req.params = { role: invalidRole };
    req.body = { email, password };

    await handler(req, res, next);

    expect(db.query).not.toBeCalled();
    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidEmailFormat error if email is invalid', async () => {
    const invalidEmail = 'invalid_email';
    const expectedError = new AppError(errDef[400].InvalidEmailFormat);

    req.params = { role };
    req.body = { email: invalidEmail, password };
    mockedEmailValidator.mockReturnValue(false);

    await handler(req, res, next);

    expect(isEmailValid).toBeCalledWith(invalidEmail);
    expect(db.query).not.toBeCalled();
    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with UserAlreadyExists error if email already exists', async () => {
    const expectedError = new AppError(errDef[409].UserAlreadyExists);

    req.params = { role };
    req.body = { email, password };
    mockedEmailValidator.mockReturnValue(true);
    mockedQuery.mockReturnValue({ rowCount: 1 });

    await handler(req, res, next);

    expect(db.query).toBeCalledWith(expect.any(String), [email]);
    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with the error if an unknown error occurs', async () => {
    const expectedError = new Error('unknown error');

    req.params = { role };
    req.body = { email, password };
    mockedEmailValidator.mockReturnValue(true);
    mockedQuery.mockReturnValue({ rowCount: 0 });
    mockedProvider.mockRejectedValue(expectedError);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(email, password, role);
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should create a user and return user_id when valid [email, password, role] is in req', async () => {
    req.params = { role };
    req.body = { email, password };
    mockedEmailValidator.mockReturnValue(true);
    mockedQuery.mockReturnValue({ rowCount: 0 });
    mockedProvider.mockResolvedValue(userId);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(email, password, role);
    expect(res.status).toBeCalledWith(201);
    expect(res.json).toBeCalledWith({ user_id: userId });
    expect(next).not.toBeCalled();
  });
});
