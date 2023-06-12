import db from '../../utils/db';
import { IUserInfo } from './types';

const SQL_READ_USER = `SELECT
id,
surname,
given_name
FROM userpool WHERE id=$1::INT;`;

const SQL_UPDATE_USER = `UPDATE userpool SET
surname=$2::TEXT,
given_name=$3::TEXT
WHERE id=$1::INT RETURNING id;`;

const provider = async (info: IUserInfo) => {
  // Get existing info from DB
  const infoQuery = await db.query(SQL_READ_USER, [info.id]);
  if (!infoQuery.rowCount) return 0;

  // Replace to new info
  const userInfo = infoQuery.rows[0] as IUserInfo;
  if (info.surname) userInfo.surname = info.surname;
  if (info.given_name) userInfo.given_name = info.given_name;

  // Update DB
  const result = await db.query(SQL_UPDATE_USER, [
    userInfo.id,
    userInfo.surname,
    userInfo.given_name,
  ]);

  return result.rowCount;
};

export default provider;
