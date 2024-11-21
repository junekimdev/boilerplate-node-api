// In typescript testing, mockings should come before imports
const path = 'path';
const key = 'key';
jest.mock('path', () => ({ resolve: jest.fn(() => path) }));
jest.mock('fs', () => ({ readFileSync: jest.fn(() => key) }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn(), verify: jest.fn() }));

// Imports
import jsonwebtoken from 'jsonwebtoken';
import jwt from '../../../src/utils/jwt';

const mockedSign = jsonwebtoken.sign as jest.Mock;
const mockedVerify = jsonwebtoken.verify as jest.Mock;

// Tests
describe('Test /src/util/jwt', () => {
  const token = 'token';
  const alg = 'ES256';
  const payload = { id: 123 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sign()', () => {
    it('should sign the payload and return a token', () => {
      const sub = 'user';
      const aud = 'server';
      const exp = '1d';
      const opt = expect.objectContaining({
        algorithm: alg,
        expiresIn: exp,
        audience: aud,
        subject: sub,
        issuer: expect.any(String),
      });

      mockedSign.mockReturnValue(token);

      const result = jwt.sign(payload, sub, aud, exp);

      expect(jsonwebtoken.sign).toBeCalledWith(payload, key, opt);
      expect(result).toBe(token);
    });
  });

  describe('verify()', () => {
    it('should verify the token and return the payload', () => {
      const aud = 'server';
      const tolerance = 10;
      const opt = expect.objectContaining({
        algorithms: expect.arrayContaining([alg]),
        audience: aud,
        issuer: expect.any(String),
        clockTolerance: tolerance,
      });

      mockedVerify.mockReturnValue(payload);

      const result = jwt.verify(token, aud);

      expect(jsonwebtoken.verify).toBeCalledWith(token, key, opt);
      expect(result).toEqual(payload);
    });
  });
});
