const fs = require('fs');
const path = require('path');
const { getArgs, askQuestion } = require('./codegen-util');

const INDEX_TXT = `export { default } from './apiHandler';
`;

const TYPES_TXT = `// export interface IReqBody {}
// export interface IResBody {}
export interface IResLocals {
  userId: number;
}
`;

const PROVIDER_TXT = `import db from '../../utils/db';
//import {} from './types';

const provider = async () => {
  return {};
};

export default provider;
`;

const API_HANDLER_TXT = `import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = res.locals as IResLocals;

    const result = await provider();
    res.status(200).json({ user_id: result });
  } catch (error) {
    next(error);
  }
};

export default handler;
`;

const getTestTxtForHanlder = (name) => `// Mocks
jest.mock('../../../../src/services/${name}/provider', () => jest.fn());

// Imports
import { NextFunction, Request, Response } from 'express';
import handler from '../../../../src/services/${name}/apiHandler';
import provider from '../../../../src/services/${name}/provider';
import { AppError, errDef } from '../../../../src/utils/errors';

const mockedProvider = provider as jest.Mock;

// Tests
describe('Test /src/services/${name}/apiHandler', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  const userId = 123;

  beforeEach(() => {
    req = { body: {} } as unknown as Request;
    res = {
      locals: { userId },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
      sendFile: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
    jest.clearAllMocks();
  });

  // it('should', async () => {});

  it('should call next with UserNotFound error when provider returns 0', async () => {
    const expectedError = new AppError(errDef[404].UserNotFound);

    mockedProvider.mockResolvedValue(0);

    // await handler(req, res, next);

    // expect(provider).toBeCalledWith();
    // expect(res.status).not.toBeCalled();
    // expect(res.json).not.toBeCalled();
    // expect(next).toBeCalledWith(expectedError);
  });

  it('should call next with the error when provider throws an error', async () => {
    const expectedError = new Error('err');

    mockedProvider.mockRejectedValue(expectedError);

    // await handler(req, res, next);

    // expect(provider).toBeCalledWith();
    // expect(res.status).not.toBeCalled();
    // expect(res.json).not.toBeCalled();
    // expect(next).toBeCalledWith(expectedError);
  });

  it('should return 200 when provider returns 1', async () => {
    mockedProvider.mockResolvedValue(1);

    // await handler(req, res, next);

    // expect(provider).toBeCalledWith();
    // expect(res.status).toBeCalledWith(200);
    // expect(res.json).toBeCalledWith(expected);
    // expect(next).not.toBeCalled();
  });
});
`;

const getTestTxtForProvider = (name) => `// Mocks
jest.mock('../../../../src/utils/db', () => ({ query: jest.fn() }));

// Imports
import provider from '../../../../src/services/${name}/provider';
import db from '../../../../src/utils/db';

const mockedDbQuery = db.query as jest.Mock;

// Tests
describe('Test /src/services/${name}/provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 0', async () => {
    // const expected = {};

    // const result = await provider();

    // expect(db.query).toBeCalledTimes(1);
    // expect(db.query).toBeCalledWith(expect.any(String), [arg1]);
    // expect(result).toEqual(expected);
  });

  it('should', async () => {});
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
    while (!name) {
      console.log('Service name is NOT found!');
      name = await askQuestion('Service name, plz?');
    }

    const dirPath = path.join(__dirname, 'src', 'services', name);
    const dirPathTest = path.join(__dirname, 'test', 'unit', 'services', name);
    try {
      await fs.promises.access(dirPath);

      // If exists, ask to overwrite or not
      console.log('A component with the given name already exists');
      const ans = await askQuestion('Do you want to overwrite it? [y/N]');
      if (ans !== 'y' && ans !== 'Y') process.exit(1);
    } catch (error) {
      // Not existing, create it
      console.log(`Creating ${dirPath}`);
      await fs.promises.mkdir(dirPath);
      console.log(`Creating ${dirPathTest}`);
      await fs.promises.mkdir(dirPathTest);
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
