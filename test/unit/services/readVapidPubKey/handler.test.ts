// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/readVapidPubKey/apiHandler';
import { AppError } from '../../../../src/utils/errors';

// Tests
describe('Test /src/services/readVapidPubKey', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const pubKey = 'VapidPublicKey';

  beforeEach(() => {
    process.env = { VAPID_PUB_KEY: pubKey };
    req = { body: {} } as Request;
    res = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should send the VAPID public key in the response body', async () => {
    await handler(req, res, next);

    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith({ key: pubKey });
    expect(next).not.toBeCalled();
  });

  it('should call next with an error if the VAPID public key is not defined', async () => {
    delete process.env.VAPID_PUB_KEY;

    await handler(req, res, next);

    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(new AppError());
  });
});
