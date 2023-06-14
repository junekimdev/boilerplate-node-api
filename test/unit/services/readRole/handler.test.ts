// Mocks
jest.mock('../../../../src/services/readRole/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/readRole/apiHandler';
import provider from '../../../../src/services/readRole/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/readRole/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const rold_id = 123;
  const roleName = 'roleName';
  const roleInfo = {
    rold_id,
    role_name: roleName,
    permissions: [
      { res_name: 'res1', readable: true, writable: false },
      { res_name: 'res2', readable: false, writable: true },
      { res_name: 'res3', readable: true, writable: true },
    ],
    created_at: Date.now(),
  };

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

  it('should return 200 with info for provider returns it', async () => {
    mockedProvider.mockResolvedValue(roleInfo);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(roleName);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith(roleInfo);
    expect(next).not.toBeCalled();
  });

  it('should call next with the error for provider throws an error', async () => {
    const expectedError = new Error();
    mockedProvider.mockRejectedValue(expectedError);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(roleName);
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });
});
