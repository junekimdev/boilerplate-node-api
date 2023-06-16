// Mocks
jest.mock('../../../../src/services/readResource/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/readResource/apiHandler';
import provider from '../../../../src/services/readResource/provider';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/readResource/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const resInfo = [
    { id: 1, name: 'res1' },
    { id: 2, name: 'res2' },
  ];

  beforeEach(() => {
    req = { body: {} } as unknown as Request;
    res = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with the error when provider throws an error', async () => {
    const expectedError = new Error('err');

    mockedProvider.mockRejectedValue(expectedError);

    await handler(req, res, next);

    expect(provider).toBeCalledWith();
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return 200 with resource info when provider returns info', async () => {
    mockedProvider.mockResolvedValue(resInfo);

    await handler(req, res, next);

    expect(provider).toBeCalledWith();
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith(resInfo);
    expect(next).not.toBeCalled();
  });
});
