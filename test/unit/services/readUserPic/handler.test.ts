// Mocks
jest.mock('../../../../src/services/readUserPic/provider', () => jest.fn());
jest.mock('path', () => ({ join: jest.fn() }));

// Imports
import { NextFunction, Request, Response } from 'express';
import path from 'path';
import handler from '../../../../src/services/readUserPic/apiHandler';
import provider from '../../../../src/services/readUserPic/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;
const mockedPathJoin = path.join as jest.Mock;

// Tests
describe('Test /src/services/readUserPic/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const userId = 123;
  const profile_url = 'profile_url';
  const filepath = 'filepath';
  const profileDir = 'profileDir';

  beforeEach(() => {
    req = { body: {} } as unknown as Request;
    res = {
      locals: { userId },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
      sendFile: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    process.env.PUBLIC_PROFILE_DIR = profileDir;
    jest.clearAllMocks();
  });

  it('should call next with UserNotFound error when provider returns empty string', async () => {
    const expectedError = new AppError(errDef[404].UserNotFound);

    mockedProvider.mockResolvedValue('');

    await handler(req, res, next);

    expect(provider).toBeCalledWith(userId);
    expect(res.status).not.toBeCalled();
    expect(res.json).not.toBeCalled();
    expect(next).toBeCalledWith(expectedError);
  });

  it('should return 204 when provider returns null', async () => {
    mockedProvider.mockResolvedValue(null);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(userId);
    expect(res.sendStatus).toBeCalledWith(204);
    expect(res.json).not.toBeCalled();
    expect(next).not.toBeCalled();
  });

  it('should return profile_url with 200 when provider returns profile_url', async () => {
    mockedProvider.mockResolvedValue(profile_url);
    mockedPathJoin.mockReturnValue(filepath);

    await handler(req, res, next);

    expect(provider).toBeCalledWith(userId);
    expect(path.join).toBeCalledWith(profileDir, profile_url);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toBeCalledWith({ profile_url: filepath });
    expect(next).not.toBeCalled();
  });
});
