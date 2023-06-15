import db from '../../utils/db';

const SQL_GET_ROLE = 'SELECT id FROM user_role WHERE name=$1::VARCHAR(50);';

const SQL_GET_USERS = `SELECT id FROM userpool WHERE role_id=$1::INT;`;

const provider = async (roleName: string) => {
  const roleQuery = await db.query(SQL_GET_ROLE, [roleName]);
  if (!roleQuery.rowCount) return 0;
  const roleId = roleQuery.rows[0].id;

  const result = await db.query(SQL_GET_USERS, [roleId]);
  const ids: number[] = [];
  result.rows.map((row) => ids.push(row.id));
  return ids;
};

export default provider;
