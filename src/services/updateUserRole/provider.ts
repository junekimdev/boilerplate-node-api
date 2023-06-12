import db from '../../utils/db';

const SQL_UPDATE_ROLE = `UPDATE userpool SET
role_id=(SELECT id FROM user_role WHERE name=$2::VARCHAR(50))
WHERE id=$1::INT
RETURNING id;`;

const provider = async (userId: number, newRole: string) => {
  const roleUpdate = await db.query(SQL_UPDATE_ROLE, [userId, newRole]);
  return roleUpdate.rowCount;
};

export default provider;
