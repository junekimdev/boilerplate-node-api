jest.mock('../../../src/utils/access', () => ({
  getRow: jest.fn(),
  requestAccess: jest.fn(() => /.*/),
}));

import { NextFunction, Request, Response } from 'express';
import allowAll from '../../../src/middleware/allowAll';
import allowPushAdmin from '../../../src/middleware/allowPushAdmin';
import allowPushUser from '../../../src/middleware/allowPushUser';
import allowUserpoolAdmin from '../../../src/middleware/allowUserpoolAdmin';
import allowUserpoolUser from '../../../src/middleware/allowUserpoolUser';
import { IBearerAuthResLocals } from '../../../src/middleware/bearerAuth';
import { getRow, requestAccess } from '../../../src/utils/access';

const controllers = [
  { name: 'allowPushAdmin', controller: allowPushAdmin },
  { name: 'allowPushUser', controller: allowPushUser },
  { name: 'allowUserpoolAdmin', controller: allowUserpoolAdmin },
  { name: 'allowUserpoolUser', controller: allowUserpoolUser },
];

describe('Test /src/middleware/allow', () => {
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
    it('allowAll should set the accessRegex in res.locals and call next', async () => {
      await allowAll(req, res, next);

      expect(requestAccess).toBeCalledTimes(1);
      expect(requestAccess).toBeCalledWith();
      expect(res.locals.accessRegex).toBeDefined();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    it.each(controllers)(
      '$name should set the accessRegex in res.locals and call next',
      async ({ controller }) => {
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
