jest.mock('../../../src/utils/access', () => ({
  getRow: jest.fn(),
  requestAccess: jest.fn(() => /.*/),
}));

import { NextFunction, Request, Response } from 'express';
import { IBearerAuthResLocals } from '../../../src/auth/bearerAuth';
import resNone from '../../../src/auth/resNone';
import resPushAdmin from '../../../src/auth/resPushAdmin';
import resPushUser from '../../../src/auth/resPushUser';
import { getRow, requestAccess } from '../../../src/utils/access';

const mockedGetRow = getRow as jest.Mock;
const mockedRequestAccess = requestAccess as jest.Mock;
const controllers = [
  { name: 'resPushAdmin', conroller: resPushAdmin },
  { name: 'resPushUser', conroller: resPushUser },
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
      mockedRequestAccess.mockReturnValue(/.*/);

      await resNone(req, res, next);

      expect(mockedRequestAccess).toBeCalledTimes(1);
      expect(mockedRequestAccess).toBeCalledWith(expect.any(Array));
      expect(res.locals.accessRegex).toBeDefined();
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith();
    });

    it.each(controllers)(
      '$name should set the accessRegex in res.locals and call next',
      async ({ name, conroller }) => {
        await conroller(req, res, next);

        expect(mockedGetRow).toBeCalled();
        expect(mockedGetRow).toBeCalledWith(
          expect.any(String),
          expect.any(Boolean),
          expect.any(Boolean),
        );
        expect(mockedRequestAccess).toBeCalledTimes(1);
        expect(mockedRequestAccess).toBeCalledWith(expect.any(Array));
        expect(res.locals.accessRegex).toBeDefined();
        expect(next).toBeCalledTimes(1);
        expect(next).toBeCalledWith();
      },
    );
  });
});
