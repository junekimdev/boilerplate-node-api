import { QueryResult } from 'pg';
import { AccessControlRow, convertToString } from '../../utils/access';
import db from '../../utils/db';
import hash from '../../utils/hash';
import jwt from '../../utils/jwt';

const SQL_ACCESS = `SELECT name, readable, writable
FROM access_control
LEFT JOIN userpool USING(role_id)
LEFT JOIN resource ON access_control.resource_id=resource.id
WHERE userpool.id=$1::INT
ORDER BY name ASC;`;

const SQL_UPSERT_TOKEN = `INSERT INTO refresh_token(user_id, device, token, created_at)
VALUES ($1::INT, $2::TEXT, $3::CHAR(44), NOW())
ON CONFLICT (user_id, device) DO UPDATE
SET token=EXCLUDED.token, created_at=NOW();`;

const SQL_UPDATE_LOGIN_TIME = `UPDATE userpool SET last_login=NOW() WHERE id=$1::INT;`;

const provider = async (userId: number, email: string, device: string) => {
  // Generate "aud" string from access control
  const accessResult = (await db.query(SQL_ACCESS, [userId])) as QueryResult<AccessControlRow>;
  const aud: string[] = [];
  accessResult.rows.forEach((row) => {
    const str = convertToString(row);
    if (str) aud.push(str);
  });

  // Generate tokens
  const access_token = jwt.sign({ user_id: userId, device }, email, aud.join(' '), '1d');
  const refresh_token = jwt.sign({ user_id: userId, device }, email, 'refresh', '30d');
  const hashed_token = hash.sha256(refresh_token);

  await db.transaction(async (client) => {
    // Save refresh token for reuse detection
    await client.query(SQL_UPSERT_TOKEN, [userId, device, hashed_token]);

    // Consider the user logged in
    await client.query(SQL_UPDATE_LOGIN_TIME, [userId]);
  });

  return { access_token, refresh_token };
};

export default provider;
