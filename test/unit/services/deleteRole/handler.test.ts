// Mocks
jest.mock('../../../../src/services/deleteRole/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/deleteRole/apiHandler';
import provider from '../../../../src/services/deleteRole/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/deleteRole/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const roleName = 'roleName';
  const roleId = 123;

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

  it('should call next with the error if provider throws an error', async () => {
    const expectedError = new Error('err');

    mockedProvider.mockRejectedValue(expectedError);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(roleName);
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with RoleNotFound error for provider returns 0', async () => {
    const expectedError = new AppError(errDef[404].RoleNotFound);

    mockedProvider.mockResolvedValue(0);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(roleName);
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return role_id with 200 for provider returns id', async () => {
    mockedProvider.mockResolvedValue(roleId);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(roleName);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith({ role_id: roleId });
    expect(next).not.toBeCalled();
  });
});
