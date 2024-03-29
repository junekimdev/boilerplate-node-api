import {
  AccessControlRow,
  convertToString,
  getRow,
  isValidPermit,
  requestAccess,
} from '../../../src/utils/access';

describe('Test /src/utils/access', () => {
  describe('isValidPermit()', () => {
    const invalidPermissions = [
      { name: 'res1', readable: true, writable: false }, // wrong res_name
      { res_name: 'res2', readable: 1, writable: false }, // wrong readable
      { res_name: 'res3', readable: true, writable: 'false' }, // wrong writable
    ];
    const validPermissions = [
      { res_name: 'res1', readable: true, writable: false },
      { res_name: 'res2', readable: false, writable: false },
      { res_name: 'res3', readable: true, writable: true },
    ];

    it.each(invalidPermissions)(
      'Test #%# should return false for it is not in correct format',
      (permit) => expect(isValidPermit(permit)).toBeFalsy(),
    );

    it.each(validPermissions)('Test #%# should return true', (permit) =>
      expect(isValidPermit(permit)).toBeTruthy(),
    );
  });

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
      const readable = false;
      const writable = true;
      const expected: AccessControlRow = { name, readable, writable };

      const result = getRow(name, readable, writable);

      expect(result).toEqual(expected);
    });
  });

  describe('requestAccess()', () => {
    it('should return a regular expression that matches the expected access patterns', () => {
      const rows: AccessControlRow[] = [
        { name: 'res1', readable: true, writable: false },
        { name: 'res2', readable: false, writable: true },
      ];

      const result = requestAccess(rows);

      expect(result).toBeInstanceOf(RegExp);

      // Single aud in access token
      expect(result.test('res1:read')).toBeFalsy();
      expect(result.test('res1:write')).toBeFalsy();
      expect(result.test('res2:read')).toBeFalsy();
      expect(result.test('res2:write')).toBeFalsy();
      expect(result.test('res3:read')).toBeFalsy();
      expect(result.test('res3:write')).toBeFalsy();
      expect(result.test('res4:read')).toBeFalsy();
      expect(result.test('res4:write')).toBeFalsy();

      // Combined aud in access token
      expect(result.test('res1:read res1:write')).toBeFalsy();
      expect(result.test('res2:read res2:write')).toBeFalsy();
      expect(result.test('res3:read res3:write')).toBeFalsy();
      expect(result.test('res4:read res4:write')).toBeFalsy();
      expect(result.test('res1:read res2:read')).toBeFalsy();
      expect(result.test('res1:read res2:write')).toBeTruthy();
      expect(result.test('res1:read res4:read')).toBeFalsy();
      expect(result.test('res1:read res2:read res3:read')).toBeFalsy();
      expect(result.test('res1:read res2:write res3:read')).toBeTruthy();
      expect(result.test('res1:read res2:read res3:read res3:write')).toBeFalsy();
      expect(result.test('res1:read res2:write res3:read res3:write')).toBeTruthy();
    });

    it('should sort rows by name and return a regular expression that matches the expected access patterns', () => {
      const rows: AccessControlRow[] = [
        { name: 'res2', readable: false, writable: true },
        { name: 'res1', readable: true, writable: false },
      ];

      const result = requestAccess(rows);

      expect(result).toBeInstanceOf(RegExp);
      expect(result.test('res1:read res2:read res3:read')).toBeFalsy();
      expect(result.test('res1:read res2:write res3:read')).toBeTruthy();
      expect(result.test('res1:read res2:read res3:read res3:write')).toBeFalsy();
      expect(result.test('res1:read res2:write res3:read res3:write')).toBeTruthy();
    });

    it('should return a regular expression that matches all if no readable or writable rows are provided', () => {
      const rows: AccessControlRow[] = [];

      const result = requestAccess(rows);

      expect(result).toBeInstanceOf(RegExp);
      expect(result.test('')).toBeTruthy();
      expect(result.test('res1:read')).toBeTruthy();
      expect(result.test('res1:write')).toBeTruthy();
      expect(result.test('res2:read')).toBeTruthy();
      expect(result.test('res2:write')).toBeTruthy();
    });

    it('should throw an error if duplicated resource name in access request are detected', () => {
      const rows: AccessControlRow[] = [
        { name: 'res1', readable: true, writable: false },
        { name: 'res1', readable: true, writable: false },
      ];

      expect(() => requestAccess(rows)).toThrow();
    });
  });
});
