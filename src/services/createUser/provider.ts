//import {} from './types';
import { db, hash } from '../../utils';

const sql = `INSERT INTO api_user(email, pw, salt)
VALUES ($1::VARCHAR(50), $2::CHAR(44), $3::CHAR(16))
RETURNING id`;

const provider = async (email: string, password: string) => {
  const emailLow = email.toLowerCase();
  const salt = hash.createSalt();
  const hashed = await hash.sha256(password + salt);

  const result = await db.query(sql, [emailLow, hashed, salt]);
  return result.rows[0].id as number;
};

export default provider;
