// Mocks
jest.mock('../../../../src/services/updateUser/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler, { invalidString } from '../../../../src/services/updateUser/apiHandler';
import provider from '../../../../src/services/updateUser/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/updateUser/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const userId = 123;
  const update_data = { surname: 'surname' };
  const newInfo = { userId, ...update_data };

  beforeEach(() => {
    req = { body: { update_data } } as unknown as Request;
    res = {
      locals: { userId },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('invalidString()', () => {
    it('should return false when data is valid', async () => {
      expect(invalidString('asdf')).toBeFalsy();
      expect(invalidString(undefined)).toBeFalsy();
    });

    it('should return true for data is invalid', async () => {
      expect(invalidString(123)).toBeTruthy();
      expect(invalidString({ id: 1 })).toBeTruthy();
      expect(invalidString([1, 2, 3])).toBeTruthy();
    });
  });

  describe('handler', () => {
    it('should call next with InvalidData error when update_data is not in req.body', async () => {
      const expectedError = new AppError(errDef[400].InvalidData);

      req.body = {};

      await handler(req, res, next);

      expect(provider).not.toBeCalled();
      expect(res.sendStatus).not.toBeCalled();
      expect(next).toBeCalledWith(expectedError);
    });

    const invalidDataCases = [123, 'string', ['array'], { given_name: 1 }, { surname: 1 }];

    it.each(invalidDataCases)(
      'should call next with InvalidData error when %s as update_data is invalid',
      async (data) => {
        const expectedError = new AppError(errDef[400].InvalidData);

        req.body = { update_data: data };

        await handler(req, res, next);

        expect(provider).not.toBeCalled();
        expect(res.sendStatus).not.toBeCalled();
        expect(next).toBeCalledWith(expectedError);
      },
    );

    it('should call next with UserNotFound error when provider returns 0', async () => {
      const expectedError = new AppError(errDef[404].UserNotFound);

      mockedProvider.mockResolvedValue(0);

      await handler(req, res, next);

      expect(provider).toBeCalledWith(newInfo);
      expect(res.sendStatus).not.toBeCalled();
      expect(next).toBeCalledWith(expectedError);
    });

    it('should return 200 when provider returns 1', async () => {
      mockedProvider.mockResolvedValue(1);

      await handler(req, res, next);

      expect(provider).toBeCalledWith(newInfo);
      expect(res.sendStatus).toBeCalledWith(200);
      expect(next).not.toBeCalled();
    });
  });
});
