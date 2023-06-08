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
import jwt, { createSignOpt, createVerifyOpt } from '../../../src/utils/jwt';

// Tests
describe('Test /src/util/jwt', () => {
  const mockPrivateKey = 'mockedPrivateKey';
  const mockPublicKey = 'mockedPublicKey';
  const sub = 'user';
  const alg = 'ES256';
  const exp = '1d';
  const tolerance = 10;

  describe('priFile', () => {
    it('should ', () => {});
  });

  describe('createSignOpt()', () => {
    it('should create an object with props:[algorithm, expiresIn, audience, subject, issuer]', () => {
      const aud = 'server';
      const expected = expect.objectContaining({
        algorithm: alg,
        expiresIn: exp,
        audience: aud,
        subject: sub,
        issuer: expect.any(String),
      });
      const opt = createSignOpt(sub, aud, exp);
      expect(opt).toEqual(expected);
    });
  });

  describe('createVerifyOpt()', () => {
    it('should create an object with props:[algorithm, subject, audience, issuer, clockTolerance]', () => {
      const aud = /server/;
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
      const aud = 'server';
      const result = jwt.sign(payload, sub, aud, exp, mockPrivateKey);
      expect(result).toBe(mockToken);
    });
  });

  describe('verify()', () => {
    it('should verify the token and return the payload', () => {
      const aud = /server/;
      const result = jwt.verify(mockToken, aud, mockPublicKey);
      expect(result).toEqual(payload);
    });
  });
});
