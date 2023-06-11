jest.mock('../../../src/utils/access', () => ({
  getRow: jest.fn(),
  requestAccess: jest.fn(() => /.*/),
}));

import { NextFunction, Request, Response } from 'express';
import { IBearerAuthResLocals } from '../../../src/auth/bearerAuth';
import resNone from '../../../src/auth/resNone';
import resPushAdmin from '../../../src/auth/resPushAdmin';
import resPushUser from '../../../src/auth/resPushUser';
import resUserpoolAdmin from '../../../src/auth/resUserpoolAdmin';
import resUserpoolUser from '../../../src/auth/resUserpoolUser';
import { getRow, requestAccess } from '../../../src/utils/access';

const controllers = [
  { name: 'resPushAdmin', controller: resPushAdmin },
  { name: 'resPushUser', controller: resPushUser },
  { name: 'resUserpoolAdmin', controller: resUserpoolAdmin },
  { name: 'resUserpoolUser', controller: resUserpoolUser },
];

describe('Test /src/auth/res', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Request;
    res = { locals: {} as IBearerAuthResLocals } as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('according to roles', () => {
    it('resNone should set the accessRegex in res.locals and call next', async () => {
      await resNone(req, res, next);

      expect(requestAccess).toBeCalledTimes(1);
      expect(requestAccess).toBeCalledWith();
      expect(res.locals.accessRegex).toBeDefined();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    it.each(controllers)(
      '$name should set the accessRegex in res.locals and call next',
      async ({ name, controller }) => {
        await controller(req, res, next);

        expect(getRow).toBeCalled();
        expect(getRow).toBeCalledWith(expect.any(String), expect.any(Boolean), expect.any(Boolean));
        expect(requestAccess).toBeCalledTimes(1);
        expect(requestAccess).toBeCalledWith(expect.any(Array));
        expect(res.locals.accessRegex).toBeDefined();
        expect(next).toBeCalledTimes(1);
        expect(next).toBeCalledWith();
      },
    );
  });
});
