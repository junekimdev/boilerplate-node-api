// Mocks
jest.mock('../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import { NextFunction, Request, Response } from 'express';
import paramRole from '../../../src/auth/paramRole';
import db from './../../../src/utils/db';
import { AppError, errDef } from './../../../src/utils/errors';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/auth/paramRole', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const role_name = 'test-role_name';

  beforeEach(() => {
    req = { body: { role_name } } as unknown as Request;
    res = { locals: {} } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with invalidRoleName error when role_name in req.body is not a string', async () => {
    const expectedError = new AppError(errDef[400].invalidRoleName);

    req.body = { role_name: 123 };

    await paramRole(req, res, next);

    expect(db.query).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with invalidRoleName error when role_name in req.body is not in DB', async () => {
    const expectedError = new AppError(errDef[400].invalidRoleName);

    mockedDbQuery.mockResolvedValue({ rowCount: 0 });

    await paramRole(req, res, next);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [role_name]);
    expect(next).toBeCalledWith(expectedError);
  });

  it('should put roleName in res.locals and call next when role_name in req.body found in DB', async () => {
    mockedDbQuery.mockResolvedValue({ rowCount: 1 });

    await paramRole(req, res, next);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [role_name]);
    expect(res.locals).toHaveProperty('roleName');
    expect(next).toBeCalledWith();
  });
});
