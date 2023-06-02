jest.mock('../../utils/access', () => ({
  requestAccess: jest.fn(() => /.*/),
}));

import { NextFunction, Request, Response } from 'express';
import { IResLocals } from '../../auth/bearerAuth';
import access from '../../auth/resNone';
import { requestAccess } from '../../utils/access';

const mockedRequestAccess = requestAccess as jest.MockedFunction<typeof requestAccess>;

describe('Test /src/auth/resNone', () => {
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
    mockedRequestAccess.mockReturnValue(/.*/);

    await access(req, res, next);

    expect(mockedRequestAccess).toHaveBeenCalledTimes(1);
    expect(mockedRequestAccess).toHaveBeenCalledWith(expect.any(Array));
    expect(res.locals.accessRegex).toBeDefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});
