import { createSalt, createUUID, sha256 } from '../../utils/hash';

describe('Test /src/util/hash', () => {
  describe('sha256()', () => {
    it('should have 44 characters', async () => {
      const payload = 'a';
      await expect(sha256(payload)).resolves.toHaveLength(44);
    });
  });

  describe('createSalt()', () => {
    it('should have 16 characters', () => {
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
