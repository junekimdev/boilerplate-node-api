jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('path', () => ({ resolve: jest.fn() }));

import dotenv from 'dotenv';
import path from 'path';

const mockedDotenvConf = dotenv.config as jest.Mock;
const mockedPathResolve = path.resolve as jest.Mock;
const testName = 'testName';

describe('Test /src/utils/config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set environmental variables, PGUSER, PGPASSWORD, and PGDATABASE in test mode', () => {
    const { NODE_ENV } = process.env;
    process.env.TEST_NAME = testName;
    const module = require('../../utils/config');
    const testPath = 'testPath';
    mockedPathResolve.mockReturnValue(testPath);

    module.config();

    const { PGUSER, PGPASSWORD, PGDATABASE } = process.env;

    expect(NODE_ENV).toBe('test');
    expect(mockedPathResolve).toHaveBeenCalled();
    expect(mockedDotenvConf).toBeCalledWith({ path: testPath });
    expect(PGUSER).toBe(testName);
    expect(PGPASSWORD).toBe(testName);
    expect(PGDATABASE).toBe(testName);
  });

  it('should set environmental variables in development mode', () => {
    process.env.NODE_ENV = 'development';
    const module = require('../../utils/config');

    module.config();

    expect(mockedDotenvConf).toHaveBeenCalled();
    expect(mockedPathResolve).not.toHaveBeenCalled();
  });

  it('should set environmental variables in production mode', () => {
    process.env.NODE_ENV = 'production';
    const module = require('../../utils/config');

    module.config();

    expect(mockedDotenvConf).toHaveBeenCalled();
    expect(mockedPathResolve).not.toHaveBeenCalled();
  });
});
