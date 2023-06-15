// Mocks
jest.mock('../../../../src/services/readRoleUser/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/readRoleUser/apiHandler';
import provider from '../../../../src/services/readRoleUser/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/readRoleUser/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const roleName = 'roleName';
  const ids = [1, 2, 3];

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

  it('should call next with RoleNotFound error when provider returns 0', async () => {
    const expectedError = new AppError(errDef[404].RoleNotFound);

    mockedProvider.mockResolvedValue(0);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(roleName);
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return user_ids with 200 when provider returns ids of users in a role', async () => {
    mockedProvider.mockResolvedValue(ids);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(roleName);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith({ user_ids: ids });
    expect(next).not.toBeCalled();
  });
});
