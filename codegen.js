const fs = require('fs');
const path = require('path');
const { getArgs, askQuestion } = require('./codegen-util');

const INDEX_TXT = `export { default } from './apiHandler';
`;

const TYPES_TXT = `//export interface IReqBody {}
export interface IResBody {}
`;

const PROVIDER_TXT = `//import {} from '../../utils';
//import {} from './types';

const provider = async () => {};

export default provider;
`;

const API_HANDLER_TXT = `import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IResBody } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resBody: IResBody = await provider();

    res.status(200).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
`;

const getTestTxtForHanlder = (name) => `// Mocks
jest.mock('../../../../services/${name}/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../services/${name}/apiHandler';
import provider from '../../../../services/${name}/provider';
import { AppError, errDef } from '../../../../utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/${name}/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = {} as Request;
    res = { locals: {} } as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('handler', () => {
    it('should call provider', async () => {
      const mockedResult = {};
      const expected = {};

      mockedProvider.mockResolvedValue(mockedResult);

      await handler(req, res, next);

      expect(provider).toHaveBeenCalledWith();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expected);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
`;

const getTestTxtForProvider = (name) => `// Mocks
jest.mock('../../../../utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../services/${name}/provider';
import db from '../../../../utils/db';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/${name}/provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('provider', () => {
    it('should return something', async () => {
      const arg1 = 'arg1';
      const arg2 = 'arg2';
      const expected = {};

      const result = await provider(arg1, arg2);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [arg1, arg2]);
      expect(result).tobe(expected);
    });
  });
});
`;

const writeService = (str, dir, filename) => {
  const filePath = path.resolve(__dirname, 'src', 'services', dir, `${filename}.ts`);
  const writer = fs.createWriteStream(filePath);
  writer.write(str);
  writer.end();
};

const writeTest = (str, dir, filename) => {
  const filePath = path.resolve(__dirname, 'test', 'unit', 'services', dir, `${filename}.test.ts`);
  const writer = fs.createWriteStream(filePath);
  writer.write(str);
  writer.end();
};

const main = async () => {
  console.log('Code generation started...');
  try {
    let { name } = getArgs();

    // Check that the required flags are in
    if (!name) {
      console.log('Service name is NOT found!');
      name = await askQuestion('Service name, plz? ');
    }

    const dirPath = path.join(__dirname, 'src', 'services', name);
    const dirPathTest = path.join(__dirname, 'test', 'unit', 'services', name);
    try {
      fs.accessSync(dirPath);

      // If exists, ask to overwrite or not
      console.log('A component with the given name already exists');
      const ans = await askQuestion('Do you want to overwrite it? [y/n] ');
      if (ans !== 'y' && ans !== 'Y') process.exit(1);
    } catch (error) {
      // Not existing, create it
      console.log(`Creating ${dirPath} & ${dirPathTest}`);
      fs.mkdirSync(dirPath);
      fs.mkdirSync(dirPathTest);
    }

    writeService(INDEX_TXT, name, 'index');
    writeService(TYPES_TXT, name, 'types');
    writeService(PROVIDER_TXT, name, 'provider');
    writeService(API_HANDLER_TXT, name, 'apiHandler');
    writeTest(getTestTxtForHanlder(name), name, 'handler');
    writeTest(getTestTxtForProvider(name), name, 'provider');

    console.log(`Service "${name}" has been successfully created`);
  } catch (err) {
    console.error(err);
  }
};

main();
