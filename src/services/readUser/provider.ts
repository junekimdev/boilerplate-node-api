import db from '../../utils/db';

const SQL_GET_USER = `SELECT
UP.id, email, surname, given_name, UR.name as role_name, last_login, UP.created_at
FROM userpool as UP LEFT JOIN user_role as UR ON UP.role_id = UR.id
WHERE UP.id=$1::INT;`;

const provider = async (userId: number) => {
  const result = await db.query(SQL_GET_USER, [userId]);
  if (!result.rowCount) return null;
  return result.rows[0];
};

export default provider;
