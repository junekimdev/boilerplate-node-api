import { AccessControlRow, convertToString, getRow, requestAccess } from '../../utils/access';

describe('Test /src/utils/access', () => {
  describe('convertToString()', () => {
    it('should return undefined if row is not readable and not writable', () => {
      const row: AccessControlRow = {
        name: 'resource',
        readable: false,
        writable: false,
      };

      const result = convertToString(row);
      expect(result).toBeUndefined();
    });

    it('should return the resource name followed by ":read" if row is readable and not writable', () => {
      const row: AccessControlRow = {
        name: 'resource',
        readable: true,
        writable: false,
      };

      const result = convertToString(row);
      expect(result).toBe('resource:read');
    });

    it('should return the resource name followed by ":write" if row is not readable and writable', () => {
      const row: AccessControlRow = {
        name: 'resource',
        readable: false,
        writable: true,
      };

      const result = convertToString(row);

      expect(result).toBe('resource:write');
    });

    it('should return the resource name followed by ":read" and ":write" if row is readable and writable', () => {
      const row: AccessControlRow = {
        name: 'resource',
        readable: true,
        writable: true,
      };

      const result = convertToString(row);
      expect(result).toBe('resource:read resource:write');
    });
  });

  describe('getRow()', () => {
    it('should return an object of AccessControlRow', () => {
      const name = 'resource';
      const writable = true;
      const readable = false;
      const expected: AccessControlRow = { name, writable, readable };

      const result = getRow(name, writable, readable);

      expect(result).toEqual(expected);
    });
  });

  describe('requestAccess()', () => {
    it('should return a regular expression that matches the expected access patterns', () => {
      const reqs: AccessControlRow[] = [
        { name: 'res1', readable: true, writable: false },
        { name: 'res2', readable: false, writable: true },
      ];

      const result = requestAccess(reqs);

      expect(result).toBeInstanceOf(RegExp);

      // Single aud in access token
      expect(result.test('res1:read')).toBe(false);
      expect(result.test('res1:write')).toBe(false);
      expect(result.test('res2:read')).toBe(false);
      expect(result.test('res2:write')).toBe(false);
      expect(result.test('res3:read')).toBe(false);
      expect(result.test('res3:write')).toBe(false);
      expect(result.test('res4:read')).toBe(false);
      expect(result.test('res4:write')).toBe(false);

      // Combined aud in access token
      expect(result.test('res1:read res1:write')).toBe(false);
      expect(result.test('res2:read res2:write')).toBe(false);
      expect(result.test('res3:read res3:write')).toBe(false);
      expect(result.test('res4:read res4:write')).toBe(false);
      expect(result.test('res1:read res2:read')).toBe(false);
      expect(result.test('res1:read res2:write')).toBe(true);
      expect(result.test('res1:read res4:read')).toBe(false);
      expect(result.test('res1:read res2:read res3:read')).toBe(false);
      expect(result.test('res1:read res2:write res3:read')).toBe(true);
      expect(result.test('res1:read res2:read res3:read res3:write')).toBe(false);
      expect(result.test('res1:read res2:write res3:read res3:write')).toBe(true);
    });

    it('should sort rows by name and return a regular expression that matches the expected access patterns', () => {
      const reqs: AccessControlRow[] = [
        { name: 'res2', readable: false, writable: true },
        { name: 'res1', readable: true, writable: false },
      ];

      const result = requestAccess(reqs);

      expect(result).toBeInstanceOf(RegExp);

      expect(result.test('res1:read res2:read res3:read')).toBe(false);
      expect(result.test('res1:read res2:write res3:read')).toBe(true);
      expect(result.test('res1:read res2:read res3:read res3:write')).toBe(false);
      expect(result.test('res1:read res2:write res3:read res3:write')).toBe(true);
    });

    it('should return a regular expression that matches all if no readable or writable rows are provided', () => {
      const reqs: AccessControlRow[] = [];

      const result = requestAccess(reqs);

      expect(result).toBeInstanceOf(RegExp);
      expect(result.test('')).toBe(true);
      expect(result.test('res1:read')).toBe(true);
      expect(result.test('res1:write')).toBe(true);
      expect(result.test('res2:read')).toBe(true);
      expect(result.test('res2:write')).toBe(true);
    });

    it('should throw an error if duplicated resource name in access request are detected', () => {
      const reqs: AccessControlRow[] = [
        { name: 'res1', readable: true, writable: false },
        { name: 'res1', readable: true, writable: false },
      ];

      expect(() => requestAccess(reqs)).toThrow();
    });
  });
});
