import { AccessControlResultRow, convertToString } from '../../utils/access';

describe('Test /src/utils/access', () => {
  describe('convertToString()', () => {
    it('should return undefined if row is not readable and not writable', () => {
      const row: AccessControlResultRow = {
        name: 'resource',
        readable: false,
        writable: false,
      };

      const result = convertToString(row);
      expect(result).toBeUndefined();
    });

    it('should return the resource name followed by ":read" if row is readable and not writable', () => {
      const row: AccessControlResultRow = {
        name: 'resource',
        readable: true,
        writable: false,
      };

      const result = convertToString(row);
      expect(result).toBe('resource:read');
    });

    it('should return the resource name followed by ":write" if row is not readable and writable', () => {
      const row: AccessControlResultRow = {
        name: 'resource',
        readable: false,
        writable: true,
      };

      const result = convertToString(row);

      expect(result).toBe('resource:write');
    });

    it('should return the resource name followed by ":read" and ":write" if row is readable and writable', () => {
      const row: AccessControlResultRow = {
        name: 'resource',
        readable: true,
        writable: true,
      };

      const result = convertToString(row);
      expect(result).toBe('resource:read resource:write');
    });
  });
});
