import dotenv from 'dotenv';
import path from 'path';

export const getProjectRoot = () => path.resolve(__dirname, '../../');

export const config = () => {
  const { NODE_ENV } = process.env;

  if (NODE_ENV === 'test') {
    const { TEST_NAME } = process.env;

    dotenv.config({ path: path.join(getProjectRoot(), '/test/test.config') });
    process.env.PGUSER = TEST_NAME;
    process.env.PGPASSWORD = TEST_NAME;
    process.env.PGDATABASE = TEST_NAME;
  } else {
    dotenv.config();
  }
};

export default config;
