jest.mock('../../../src/utils/access', () => ({
  getRow: jest.fn(),
  requestAccess: jest.fn(() => /.*/),
}));

import { NextFunction, Request, Response } from 'express';
import { IResLocals } from '../../../src/auth/bearerAuth';
import access from '../../../src/auth/resPushAdmin';
import { getRow, requestAccess } from '../../../src/utils/access';

const mockedGetRow = getRow as jest.Mock;
const mockedRequestAccess = requestAccess as jest.Mock;

describe('Test /src/auth/resPushAdmin', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Request;
    res = { locals: {} as IResLocals } as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should set the accessRegex in res.locals and call next', async () => {
    await access(req, res, next);

    expect(mockedGetRow).toHaveBeenCalled();
    expect(mockedGetRow).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Boolean),
      expect.any(Boolean),
    );
    expect(mockedRequestAccess).toHaveBeenCalledTimes(1);
    expect(mockedRequestAccess).toHaveBeenCalledWith(expect.any(Array));
    expect(res.locals.accessRegex).toBeDefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});
