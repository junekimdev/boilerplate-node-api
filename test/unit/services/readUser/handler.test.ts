// Mocks
jest.mock('../../../../src/services/readUser/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/readUser/apiHandler';
import provider from '../../../../src/services/readUser/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/readUser/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  const userId = 123;

  beforeEach(() => {
    req = { body: {} } as Request;
    res = {
      locals: { decodedToken: {} },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should call next with InvalidToken error when userId cannot be found in token', async () => {
      const expectedError = new AppError(errDef[401].InvalidToken);

      await handler(req, res, next);

      expect(provider).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(res.json).not.toBeCalled();
      expect(next).toBeCalledWith(expectedError);
    });

    it('should call next with UserNotFound error when user is not in DB', async () => {
      const expectedError = new AppError(errDef[404].UserNotFound);

      res.locals.decodedToken = { user_id: userId };
      mockedProvider.mockResolvedValue(null);

      await handler(req, res, next);

      expect(provider).toBeCalledWith(userId);
      expect(res.status).not.toBeCalled();
      expect(res.json).not.toBeCalled();
      expect(next).toBeCalledWith(expectedError);
    });

    it('should return user info', async () => {
      const userInfo = { id: userId };

      res.locals.decodedToken = { user_id: userId };
      mockedProvider.mockResolvedValue(userInfo);

      await handler(req, res, next);

      expect(provider).toBeCalledWith(userId);
      expect(res.status).toBeCalledWith(200);
      expect(res.json).toBeCalledWith(userInfo);
      expect(next).not.toBeCalled();
    });
  });
});
