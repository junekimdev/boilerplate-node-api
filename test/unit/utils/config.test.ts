jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('path', () => ({ resolve: jest.fn(), join: jest.fn() }));

import dotenv from 'dotenv';
import path from 'path';

const mockedPathResolve = path.resolve as jest.Mock;
const mockedPathJoin = path.join as jest.Mock;

describe('Test /src/utils/config', () => {
  const testName = 'testName';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjectRoot()', () => {
    it('should return a string of dir of project root', () => {
      mockedPathResolve.mockRestore();
      const root = path.resolve(__dirname, '../../../');
      const module = require('../../../src/utils/config');

      const result = module.getProjectRoot();

      expect(result).toBe(root);
    });
  });

  describe('config()', () => {
    it('should set environmental variables, PGUSER, PGPASSWORD, and PGDATABASE in test mode', () => {
      const { NODE_ENV } = process.env;
      process.env.TEST_NAME = testName;
      const module = require('../../../src/utils/config');
      const testPath = 'testPath';

      mockedPathJoin.mockReturnValue(testPath);

      module.config();

      const { PGUSER, PGPASSWORD, PGDATABASE } = process.env;

      expect(NODE_ENV).toBe('test');
      expect(path.resolve).toBeCalled();
      expect(path.join).toBeCalled();
      expect(dotenv.config).toBeCalledWith({ path: testPath });
      expect(PGUSER).toBe(testName);
      expect(PGPASSWORD).toBe(testName);
      expect(PGDATABASE).toBe(testName);
    });

    it('should set environmental variables in development mode', () => {
      process.env.NODE_ENV = 'development';
      const module = require('../../../src/utils/config');

      module.config();

      expect(dotenv.config).toBeCalled();
      expect(path.join).not.toBeCalled();
    });

    it('should set environmental variables in production mode', () => {
      process.env.NODE_ENV = 'production';
      const module = require('../../../src/utils/config');

      module.config();

      expect(dotenv.config).toBeCalled();
      expect(path.join).not.toBeCalled();
    });
  });
});
