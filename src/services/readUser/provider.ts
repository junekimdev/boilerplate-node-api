import db from '../../utils/db';

const SQL_GET_USER = 'SELECT * FROM userpool WHERE id=$1::INT;';

const SQL_GET_ROLE = 'SELECT name FROM user_role WHERE id=$1::INT;';

const provider = async (userId: number) => {
  // Get user info
  const user = await db.query(SQL_GET_USER, [userId]);
  if (!user.rowCount) return null;

  // Get role_name
  const role = await db.query(SQL_GET_ROLE, [user.rows[0].role_id]);

  // Format the result
  const result = { ...user.rows[0] };
  delete result.id; // to replace property name
  delete result.role_id; // to replace property name
  delete result.pw; // for secret
  delete result.salt; // for secret
  result['user_id'] = user.rows[0].id;
  result['role_name'] = role.rows[0].name;

  return result;
};

export default provider;
