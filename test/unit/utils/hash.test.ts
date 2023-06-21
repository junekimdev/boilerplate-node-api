import { createSalt, createUUID, passSalt, sha256 } from '../../../src/utils/hash';

describe('Test /src/util/hash', () => {
  describe('sha256()', () => {
    it('should create a string with 44 characters', async () => {
      const payload = 'a';
      await expect(sha256(payload)).toHaveLength(44);
    });
  });

  describe('passSalt()', () => {
    it('should create a string with 44 characters', async () => {
      const password = 'password';
      const salt = 'salt';
      await expect(passSalt(password, salt)).toHaveLength(44);
    });
  });

  describe('createSalt()', () => {
    it('should create a string with 16 characters', () => {
      expect(createSalt()).toHaveLength(16);
    });
  });

  describe('createUUID()', () => {
    it('should be different from each other', () => {
      const repeatCount = 10;
      const resultSet = new Set();
      for (let i = 0; i < repeatCount; i++) resultSet.add(createUUID());
      expect(resultSet.size).toBe(repeatCount);
    });
  });
});
