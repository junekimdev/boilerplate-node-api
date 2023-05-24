import { db } from '../../utils';
import { ISubscription } from './types';

const sql_check = `SELECT id
FROM push_subscription
WHERE sub=($1::TEXT)`;

const sql_insert = `INSERT INTO push_subscription(sub)
VALUES ($1::TEXT)`;

const provider = async (subscription: ISubscription) => {
  const subStr = JSON.stringify(subscription);
  await db.transaction(async (client) => {
    const result = await db.query(sql_check, [subStr]); // Check if already exists
    if (!result.rowCount) await db.query(sql_insert, [subStr]);
  });
};

export default provider;
