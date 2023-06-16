import db from '../../utils/db';
import { IUserInfo } from './types';

const SQL_READ_USER = 'SELECT * FROM userpool WHERE id=$1::INT;';

const SQL_UPDATE_USER = `UPDATE userpool SET
surname=$2::TEXT,
given_name=$3::TEXT
WHERE id=$1::INT RETURNING id;`;

const provider = async (newInfo: IUserInfo) => {
  // Get existing info from DB
  const infoQuery = await db.query(SQL_READ_USER, [newInfo.userId]);
  if (!infoQuery.rowCount) return 0;

  // Replace with new info
  const info = { ...infoQuery.rows[0] };
  if (newInfo.surname) info.surname = newInfo.surname;
  if (newInfo.given_name) info.given_name = newInfo.given_name;

  // Update DB
  const result = await db.query(SQL_UPDATE_USER, [newInfo.userId, info.surname, info.given_name]);

  return result.rowCount;
};

export default provider;
