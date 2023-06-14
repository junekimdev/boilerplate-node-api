// Mocks
jest.mock('../../../../src/services/updateRole/provider', () => jest.fn());
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));
jest.mock('../../../../src/utils/access', () => ({ isValidPermit: jest.fn() }));

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/updateRole/apiHandler';
import provider from '../../../../src/services/updateRole/provider';
import { IPermission, isValidPermit } from '../../../../src/utils/access';
import db from '../../../../src/utils/db';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedDbQuery = db.query as jest.Mock;
const mockedPermitValidator = isValidPermit as jest.Mock;
const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/updateRole/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const roleName = 'old-role';
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
      locals: { roleName },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  // it('should', async () => {});

  it('should call next with DataNotFound error for update_data is not in req.body', async () => {
    const expectedError = new AppError(errDef[404].DataNotFound);

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidRoleName error for role_name in data is not a string', async () => {
    const update_data = { role_name: 123, permissions };
    const expectedError = new AppError(errDef[400].InvalidRoleName);

    req.body = { update_data };

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with RoleAlreadyExists error for new name in data already exists', async () => {
    const update_data = { role_name, permissions };
    const expectedError = new AppError(errDef[409].RoleAlreadyExists);

    req.body = { update_data };
    mockedDbQuery.mockResolvedValue({ rowCount: 1 });

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidRolePermission error for permissions is not an array', async () => {
    const update_data = { role_name };
    const expectedError = new AppError(errDef[400].InvalidRolePermission);

    req.body = { update_data };
    mockedDbQuery.mockResolvedValue({ rowCount: 0 });

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with InvalidRolePermission error for permissions is not an array of IPermission', async () => {
    const invalidPermissions = [{ name: 'res1', readable: true, writable: false }];
    const update_data = { role_name, permissions: invalidPermissions };
    const expectedError = new AppError(errDef[400].InvalidRolePermission);

    req.body = { update_data };
    mockedDbQuery.mockResolvedValue({ rowCount: 0 });
    mockedPermitValidator.mockReturnValue(false);

    await handler(req, res, next);

    expect(provider).not.toBeCalled();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return 200 with role_id for provider updates the role successfully', async () => {
    const update_data = { role_name, permissions };

    req.body = { update_data };
    mockedDbQuery.mockResolvedValue({ rowCount: 0 });
    mockedPermitValidator.mockReturnValue(true);
    mockedProvider.mockResolvedValue(roleId);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(roleName, role_name, permissions);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith({ role_id: roleId });
    expect(next).not.toBeCalled();
  });
});
