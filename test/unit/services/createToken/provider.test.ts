// Mocks
const client = { query: jest.fn() };
jest.mock('../../../../src/utils/hash', () => ({ sha256: jest.fn() }));
jest.mock('../../../../src/utils/db', () => ({
  query: jest.fn(),
  transaction: jest.fn((f) => f(client)),
}));
jest.mock('../../../../src/utils/jwt', () => ({ sign: jest.fn() }));
jest.mock('../../../../src/utils/access', () => ({ convertToString: jest.fn() }));

// Imports
import { QueryResult } from 'pg';
import provider from '../../../../src/services/createToken/provider';
import { AccessControlRow, convertToString } from '../../../../src/utils/access';
import db from '../../../../src/utils/db';
import hash from '../../../../src/utils/hash';
import jwt from '../../../../src/utils/jwt';

const mockedDbQuery = db.query as jest.Mock;
const mockedConvertToString = convertToString as jest.Mock;
const mockedJwtSign = jwt.sign as jest.Mock;
const mockedHashSha256 = hash.sha256 as jest.Mock;

// Tests
describe('Test /src/services/createToken/provider', () => {
  const token = 'mockedJWTToken';
  const hashedToken = 'mockedhashedJWTToken';
  const userId = 123;
  const email = 'test@example.com';
  const device = 'device_uuid';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should query the database and generate a JWT token and save refresh token', async () => {
    const queryResult = {
      rows: [
        { name: 'resource1', readable: true, writable: false },
        { name: 'resource2', readable: true, writable: false },
      ],
    };
    const expectedAccessString = 'resource1:read resource2:read';
    const expectedSignArgs = [
      [{ user_id: userId, device }, email, expectedAccessString, '1d'],
      [{ user_id: userId, device }, email, 'refresh', '30d'],
    ];
    const expectedResult = { access_token: token, refresh_token: token };
    const expectedClientQuery = jest.fn();

    mockedDbQuery.mockResolvedValue(queryResult);
    mockedConvertToString.mockImplementation((row) => `${row.name}:read`);
    mockedJwtSign.mockReturnValue(token);
    mockedHashSha256.mockReturnValue(hashedToken);

    const result = await provider(userId, email, device);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [userId]);
    expect(convertToString).toBeCalledTimes(2);
    expect(convertToString).nthCalledWith(1, queryResult.rows[0]);
    expect(convertToString).nthCalledWith(2, queryResult.rows[1]);
    expect(jwt.sign).toBeCalledTimes(2);
    expect(jwt.sign).nthCalledWith(1, ...expectedSignArgs[0]);
    expect(jwt.sign).nthCalledWith(2, ...expectedSignArgs[1]);
    expect(hash.sha256).toBeCalledTimes(1);
    expect(db.transaction).toBeCalled();
    expect(client.query).toBeCalledTimes(2);
    expect(client.query).nthCalledWith(1, expect.any(String), [userId, device, hashedToken]);
    expect(client.query).nthCalledWith(2, expect.any(String), [userId]);
    expect(result).toEqual(expectedResult);
  });

  it('should query the database and generate a JWT token with empty string "aud" if no access permits found', async () => {
    const expectedResult = { access_token: token, refresh_token: token };
    const expectedSignArgs = [
      [{ user_id: userId, device }, email, '', '1d'],
      [{ user_id: userId, device }, email, 'refresh', '30d'],
    ];

    mockedDbQuery.mockResolvedValue({ rows: [] });
    mockedConvertToString.mockReturnValue(undefined);
    mockedJwtSign.mockReturnValue(token);
    mockedHashSha256.mockReturnValue(hashedToken);

    const result = await provider(userId, email, device);

    expect(db.query).toBeCalledTimes(1);
    expect(db.query).toBeCalledWith(expect.any(String), [userId]);
    expect(convertToString).not.toBeCalled();
    expect(jwt.sign).toBeCalledTimes(2);
    expect(jwt.sign).nthCalledWith(1, ...expectedSignArgs[0]);
    expect(jwt.sign).nthCalledWith(2, ...expectedSignArgs[1]);
    expect(hash.sha256).toBeCalledTimes(1);
    expect(db.transaction).toBeCalled();
    expect(client.query).toBeCalledTimes(2);
    expect(client.query).nthCalledWith(1, expect.any(String), [userId, device, hashedToken]);
    expect(client.query).nthCalledWith(2, expect.any(String), [userId]);
    expect(result).toEqual(expectedResult);
  });
});
