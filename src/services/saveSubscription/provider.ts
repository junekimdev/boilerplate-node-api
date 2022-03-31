import { db } from '../../utils';
import { ISubscription } from './types';

const sql_check = `SELECT id
FROM push_sub
WHERE sub = ($1::TEXT)`;

const sql_insert = `INSERT INTO push_sub(sub)
VALUES ($1::TEXT)`;

const provider = async (subscription: ISubscription) => {
  const subStr = JSON.stringify(subscription);
  const result = await db.query(sql_check, [subStr]); // Check if already exists
  if (!result.rowCount) await db.query(sql_insert, [subStr]);
};

export default provider;
