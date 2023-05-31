import {
  AccessControlResultRow,
  convertToString,
  isReadable,
  isWritable,
} from '../../utils/access';

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

    it('should return the resource name if row is readable and writable', () => {
      const row: AccessControlResultRow = {
        name: 'resource',
        readable: true,
        writable: true,
      };

      const result = convertToString(row);
      expect(result).toBe('resource');
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
  });

  describe('isReadable()', () => {
    const accessString = 'resource1 resource2:read resource3:write';

    it('should return true if the resource is readable in the accessString', () => {
      const result1 = isReadable(accessString, 'resource1');
      const result2 = isReadable(accessString, 'resource2');
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should return false if the resource is not readable in the accessString', () => {
      const result = isReadable(accessString, 'resource3');
      expect(result).toBe(false);
    });
  });

  describe('isWritable()', () => {
    const accessString = 'resource1 resource2:read resource3:write';

    it('should return true if the resource is writable in the accessString', () => {
      const result1 = isWritable(accessString, 'resource1');
      const result2 = isWritable(accessString, 'resource3');
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should return false if the resource is not writable in the accessString', () => {
      const result = isWritable(accessString, 'resource2');
      expect(result).toBe(false);
    });
  });
});
