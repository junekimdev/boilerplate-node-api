const fs = require('fs');
const path = require('path');
const { getArgs, askQuestion } = require('./codegen-util');

const INDEX_TXT = `export { default } from './apiHandler';
`;
const TYPES_TXT = `//export interface IReqBody {}
//export interface IResBody {}
`;
const PROVIDER_TXT = `//import {} from './types';
//import {} from '../../utils';

const provider = async () => {};

export default provider;
`;
const API_HANDLER_TXT = `import { Request, Response, NextFunction } from 'express';
import provider from './provider';
//import {} from './types';
//import { errDef, AppError } from '../../utils';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await provider();
    const resBody = {}
    res.status(200).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
`;

const write = (str, dir, filename, flags) => {
  const filePath = path.join(
    __dirname,
    'src',
    'services',
    dir,
    `${filename}.ts`
  );
  const writer = fs.createWriteStream(filePath, { flags });
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
    try {
      fs.accessSync(dirPath);

      // If exists, ask to overwrite or not
      console.log('A component with the given name already exists');
      const ans = await askQuestion('Do you want to overwrite it? [y/n] ');
      if (ans !== 'y' && ans !== 'Y') process.exit(1);
    } catch (error) {
      // Not existing, create it
      console.log(`Creating ${dirPath}`);
      fs.mkdirSync(dirPath);
    }

    write(INDEX_TXT, name, 'index', 'w');
    write(TYPES_TXT, name, 'types', 'w');
    write(PROVIDER_TXT, name, 'provider', 'w');
    write(API_HANDLER_TXT, name, 'apiHandler', 'w');

    console.log(`Service [${name}] has been successfully created`);
  } catch (err) {
    console.error(err);
  }
};

main();
