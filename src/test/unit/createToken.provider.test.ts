jest.mock('../../utils', () => ({
  db: {
    query: jest.fn(),
  },
  convertToString: jest.fn(),
  jwt: {
    sign: jest.fn(),
  },
}));

import { QueryResult } from 'pg';
import provider from '../../services/createToken/provider';
import { AccessControlResultRow, convertToString, db, jwt } from '../../utils';

describe('Test /src/services/createToken/provider', () => {
  const mockedDbQuery = db.query as jest.Mock;
  const mockedConvertToString = convertToString as jest.Mock;
  const mockedJwtSign = jwt.sign as jest.Mock;
  const mockedToken = 'mockedJWTToken';
  const userId = 123;
  const email = 'test@example.com';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should query the database and generate a JWT token', async () => {
    //@ts-ignore
    const queryResult: QueryResult<AccessControlResultRow> = {
      rows: [
        { name: 'resource1', readable: true, writable: false },
        { name: 'resource2', readable: true, writable: false },
      ],
    };
    const expectedAccessString = 'resource1:read resource2:read';
    const expectedResult = { access_token: mockedToken, refresh_token: mockedToken };

    mockedDbQuery.mockResolvedValue(queryResult);
    mockedConvertToString.mockImplementation((row) => `${row.name}:read`);
    mockedJwtSign.mockReturnValue(mockedToken);

    const result = await provider(userId, email);

    expect(mockedDbQuery).toHaveBeenCalledWith(expect.any(String), [email]);
    expect(mockedConvertToString).toHaveBeenCalledTimes(2);
    expect(mockedConvertToString).toHaveBeenCalledWith(queryResult.rows[0]);
    expect(mockedConvertToString).toHaveBeenCalledWith(queryResult.rows[1]);
    expect(mockedJwtSign).toHaveBeenCalledTimes(2);
    expect(mockedJwtSign).toHaveBeenNthCalledWith(
      1,
      { user_id: userId },
      email,
      expectedAccessString,
      '1d',
    );
    expect(mockedJwtSign).toHaveBeenNthCalledWith(2, { user_id: userId }, email, 'refresh', '30d');
    expect(result).toEqual(expectedResult);
  });

  it('should query the database and generate a JWT token with aud being an empty string if no access control rows are readable', async () => {
    //@ts-ignore
    const queryResult: QueryResult<AccessControlResultRow> = {
      rows: [
        { name: 'resource1', readable: false, writable: false },
        { name: 'resource2', readable: false, writable: false },
      ],
    };
    const expectedResult = { access_token: mockedToken, refresh_token: mockedToken };

    mockedDbQuery.mockResolvedValue(queryResult);
    mockedConvertToString.mockReturnValue(undefined);
    mockedJwtSign.mockReturnValue(mockedToken);

    const result = await provider(userId, email);

    expect(mockedDbQuery).toHaveBeenCalledWith(expect.any(String), [email]);
    expect(mockedConvertToString).toHaveBeenCalledTimes(2);
    expect(mockedConvertToString).toHaveBeenCalledWith(queryResult.rows[0]);
    expect(mockedConvertToString).toHaveBeenCalledWith(queryResult.rows[1]);
    expect(mockedJwtSign).toHaveBeenCalledTimes(2);
    expect(mockedJwtSign).toHaveBeenNthCalledWith(1, { user_id: userId }, email, '', '1d');
    expect(mockedJwtSign).toHaveBeenNthCalledWith(2, { user_id: userId }, email, 'refresh', '30d');
    expect(result).toEqual(expectedResult);
  });
});
