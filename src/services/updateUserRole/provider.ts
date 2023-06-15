import db from '../../utils/db';
import { AppError, errDef, NULL_ERR_CODE } from '../../utils/errors';

const SQL_UPDATE_ROLE = `UPDATE userpool SET
role_id=(SELECT id FROM user_role WHERE name=$2::VARCHAR(50))
WHERE id=$1::INT
RETURNING id;`;

const provider = async (userId: number, newRole: string) => {
  try {
    const result = await db.query(SQL_UPDATE_ROLE, [userId, newRole]);
    if (!result.rowCount) throw new AppError(errDef[404].UserNotFound);
    return result.rows[0].id as number;
  } catch (error: any) {
    if (error.code === NULL_ERR_CODE) throw new AppError(errDef[404].RoleNotFound);
    throw error;
  }
};

export default provider;
