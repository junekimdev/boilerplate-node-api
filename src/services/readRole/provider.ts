import db from '../../utils/db';

const SQL_READ_ROLE = 'SELECT id, created_at FROM user_role WHERE name=$1::VARCHAR(50)';

const SQL_READ_ACCESS = `SELECT T3.name as res_name, readable, writable
FROM access_control as T1
LEFT JOIN user_role as T2 ON T1.role_id=T2.id
LEFT JOIN resource as T3 ON T1.resource_id=T3.id
WHERE T2.name=$1::VARCHAR(50)`;

const provider = async (roleName: string) => {
  // Get created_at
  const roleQuery = await db.query(SQL_READ_ROLE, [roleName]);
  if (!roleQuery.rowCount) return null;
  const role_id = roleQuery.rows[0].id;
  const created_at = roleQuery.rows[0].created_at;

  // Get permissions
  const accessQuery = await db.query(SQL_READ_ACCESS, [roleName]);
  const permissions = accessQuery.rows;

  // Return
  return { role_id, role_name: roleName, permissions, created_at };
};

export default provider;
