// Mocks
const mockedVapidPubKey = 'mockedVapidPublicKey';
const mockedError = new Error('mockedError');

jest.mock('express', () => ({
  Request: jest.fn(),
  Response: jest.fn(),
}));

jest.mock('../../utils', () => ({
  AppError: jest.fn(() => mockedError),
}));

const mockedRequest = (body: any = {}): Request => ({ body } as Request);
const mockedResponse = (): Response => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as Response;
};
const mockedNext = () => jest.fn() as NextFunction;

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../services/readVapidPubKey/apiHandler';

// Tests
describe('Test /src/services/readVapidPubKey', () => {
  beforeEach(() => {
    process.env = { VAPID_PUB_KEY: mockedVapidPubKey };
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send the VAPID public key in the response body', async () => {
    const req = mockedRequest();
    const res = mockedResponse();
    const next = mockedNext();

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ key: mockedVapidPubKey });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with an error if the VAPID public key is not defined', async () => {
    delete process.env.VAPID_PUB_KEY;
    const req = mockedRequest();
    const res = mockedResponse();
    const next = mockedNext();

    await handler(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(mockedError);
  });
});
