// Mocks
jest.mock('../../../../src/services/deleteUser/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/deleteUser/apiHandler';
import provider from '../../../../src/services/deleteUser/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/deleteUser/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  const userId = 123;

  beforeEach(() => {
    req = { body: {} } as Request;
    res = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should return InvalidToken error when userId is not a number in token', async () => {
      const expecteError = new AppError(errDef[401].InvalidToken);

      res.locals = { decodedToken: { user_id: `${userId}` } };

      await handler(req, res, next);

      expect(provider).not.toBeCalled();
      expect(res.status).not.toBeCalled();
      expect(res.json).not.toBeCalled();
      expect(next).toBeCalledWith(expecteError);
    });

    it('should return UserNotFound error when user is not in DB to delete', async () => {
      const expecteError = new AppError(errDef[404].UserNotFound);

      mockedProvider.mockResolvedValue(0);
      res.locals = { decodedToken: { user_id: userId } };

      await handler(req, res, next);

      expect(provider).toBeCalledWith(userId);
      expect(res.status).not.toBeCalled();
      expect(res.json).not.toBeCalled();
      expect(next).toBeCalledWith(expecteError);
    });

    it('should call provider with userId and return 200 when succussful', async () => {
      mockedProvider.mockResolvedValue(userId);
      res.locals = { decodedToken: { user_id: userId } };

      await handler(req, res, next);

      expect(provider).toBeCalledWith(userId);
      expect(res.status).toBeCalledWith(200);
      expect(res.json).toBeCalledWith({ user_id: userId });
      expect(next).not.toBeCalledWith();
    });
  });
});
