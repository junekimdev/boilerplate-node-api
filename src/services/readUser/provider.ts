import db from '../../utils/db';

const SQL_GET_USER = `SELECT
T1.id as user_id, T1.email, T1.surname, T1.given_name, T2.name as role_name, T1.last_login, T1.created_at
FROM userpool as T1 LEFT JOIN user_role as T2 ON T1.role_id=T2.id
WHERE T1.id=$1::INT;`;

const provider = async (userId: number) => {
  const result = await db.query(SQL_GET_USER, [userId]);
  if (!result.rowCount) return null;
  return result.rows[0];
};

export default provider;
