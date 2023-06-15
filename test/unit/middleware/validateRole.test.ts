// Imports
import { NextFunction, Request, Response } from 'express';
import validateRole from '../../../src/middleware/validateRole';
import { AppError, errDef } from '../../../src/utils/errors';

// Tests
describe('Test /src/middleware/validateRole', () => {
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

  it('should call next with InvalidRoleName error when role_name in req.body is not a string', async () => {
    const expectedError = new AppError(errDef[400].InvalidRoleName);

    req.body = { role_name: 123 };

    await validateRole(req, res, next);

    expect(next).toBeCalledWith(expectedError);
  });

  it('should put roleName in res.locals and call next when role_name in req.body found in DB', async () => {
    await validateRole(req, res, next);

    expect(res.locals).toHaveProperty('roleName');
    expect(next).toBeCalledWith();
  });
});
