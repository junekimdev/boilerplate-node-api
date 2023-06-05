import { QueryResult } from 'pg';
import { AccessControlRow, convertToString, db, jwt } from '../../utils';

const SQL_ACCESS = `SELECT name, readable, writable
FROM access_control
LEFT JOIN userpool USING(role_id)
LEFT JOIN resource ON access_control.resource_id=resource.id
WHERE email=$1::VARCHAR(50)
ORDER BY name ASC;`;

const provider = async (userId: number, email: string) => {
  const result = (await db.query(SQL_ACCESS, [email])) as QueryResult<AccessControlRow>;
  const aud: string[] = [];
  result.rows.forEach((row) => {
    const str = convertToString(row);
    if (str) aud.push(str);
  });
  const access_token = jwt.sign({ user_id: userId }, email, aud.join(' '), '1d');
  const refresh_token = jwt.sign({ user_id: userId }, email, 'refresh', '30d');
  return { access_token, refresh_token };
};

export default provider;
