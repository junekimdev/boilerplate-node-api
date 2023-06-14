// Mocks
jest.mock('../../../../src/services/createRole/provider', () => jest.fn());
jest.mock('../../../../src/utils/access', () => ({ isValidPermit: jest.fn() }));

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/createRole/apiHandler';
import provider from '../../../../src/services/createRole/provider';
import { IPermission, isValidPermit } from '../../../../src/utils/access';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;
const mockedPermitValidator = isValidPermit as jest.Mock;

// Tests
describe('Test /src/services/createRole/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const role_name = 'test-role';
  const roleId = 123;
  const permissions: IPermission[] = [
    { res_name: 'res1', readable: true, writable: false },
    { res_name: 'res2', readable: false, writable: true },
    { res_name: 'res3', readable: true, writable: true },
  ];

  beforeEach(() => {
    req = { body: {} } as unknown as Request;
    res = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with InvalidRoleName error when role_name not a string in req.body', async () => {
    const expectedError = new AppError(errDef[400].InvalidRoleName);

    req.body = { permissions };

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidRolePermission error when permissions not in req.body', async () => {
    const expectedError = new AppError(errDef[400].InvalidRolePermission);

    req.body = { role_name };

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidRolePermission error for permissions not an array of IPermission in req.body', async () => {
    const invalidPermissions = [{ name: 'res1', readable: true, writable: false }];
    const expectedError = new AppError(errDef[400].InvalidRolePermission);

    req.body = { role_name, permissions: invalidPermissions };
    mockedPermitValidator.mockReturnValue(false);

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with RoleAlreadyExists error for provider returns 0', async () => {
    const expectedError = new AppError(errDef[409].RoleAlreadyExists);

    req.body = { role_name, permissions };
    mockedPermitValidator.mockReturnValue(true);
    mockedProvider.mockResolvedValue(0);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(role_name, permissions);
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return 201 with role_id when provider returns role_id', async () => {
    req.body = { role_name, permissions };
    mockedPermitValidator.mockReturnValue(true);
    mockedProvider.mockResolvedValue(roleId);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(role_name, permissions);
    expect(res.status).toBeCalledWith(201);
    expect(res.json).toBeCalledWith({ role_id: roleId });
    expect(next).not.toBeCalled();
  });
});
