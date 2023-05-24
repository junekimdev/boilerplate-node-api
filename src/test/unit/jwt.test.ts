// In typescript testing, mockings should come before imports
const mockToken = 'mockedToken';
const payload = { id: 123 };
jest.mock('fs', () => {
  return { readFileSync: jest.fn((filename) => '') };
});
jest.mock('jsonwebtoken', () => {
  return { sign: jest.fn(() => mockToken), verify: jest.fn(() => payload) };
});

// Imports
import jsonwebtoken from 'jsonwebtoken';
import jwt, { createSignOpt, createVerifyOpt } from '../../utils/jwt';

// Tests
describe('Test /src/util/jwt', () => {
  const mockPrivateKey = 'mockedPrivateKey';
  const mockPublicKey = 'mockedPublicKey';
  const sub = 'user';
  const aud = 'server';
  const alg = 'ES256';
  const exp = '1d';
  const tolerance = 10;

  describe('priFile', () => {
    it('should ', () => {});
  });

  describe('createSignOpt()', () => {
    it('should create an object with props:[algorithm, expiresIn, audience, subject, issuer]', () => {
      const expected = expect.objectContaining({
        algorithm: alg,
        expiresIn: exp,
        audience: aud,
        subject: sub,
        issuer: expect.any(String),
      });
      const opt = createSignOpt(sub, aud);
      expect(opt).toEqual(expected);
    });
  });

  describe('createVerifyOpt()', () => {
    it('should create an object with props:[algorithm, audience, issuer, clockTolerance, complete]', () => {
      const expected = expect.objectContaining({
        algorithms: expect.arrayContaining([alg]),
        audience: aud,
        issuer: expect.any(String),
        clockTolerance: tolerance,
      });
      const opt = createVerifyOpt(aud);
      expect(opt).toEqual(expected);
    });
  });

  describe('sign()', () => {
    it('should sign the payload and return a token', () => {
      const result = jwt.sign(payload, sub, aud, mockPrivateKey);
      expect(result).toBe(mockToken);
    });
  });

  describe('verify()', () => {
    it('should verify the token and return the payload', () => {
      const result = jwt.verify(mockToken, aud, mockPublicKey);
      expect(result).toEqual(payload);
    });
  });
});
