//import {} from './types';
import { db, hash } from '../../utils';

const sql_insert_user = `INSERT INTO users(email, pw, salt)
VALUES ($1::VARCHAR(50), $2::CHAR(44), $3::CHAR(16))
RETURNING id`;

const sql_insert_access = `INSERT INTO access_control(resource_id, user_id, write_permit, read_permit)
SELECT (
  (SELECT id FROM resources WHERE full_uri=($1::VARCHAR(50)) OR short_uri=($1::VARCHAR(50))),
  (SELECT id FROM users WHERE email=($2::VARCHAR(50))),
  ($3::BOOLEAN), ($4::BOOLEAN))`;

const provider = async (email: string, password: string) => {
  const emailLow = email.toLowerCase().trim();
  const salt = hash.createSalt();
  const hashed = await hash.sha256(password + salt);

  const result = await db.transaction(async (client) => {
    const id = await client.query(sql_insert_user, [emailLow, hashed, salt]);
    await client.query(sql_insert_access, ['user', emailLow, true, true]);
    return id;
  });

  return result.rows[0].id as number;
};

export default provider;
