import db, { FK_ERR_CODE } from '../../utils/db';
import { AppError, errDef } from '../../utils/errors';

const SQL_DELETE_ROLE = 'DELETE FROM user_role WHERE name=$1::VARCHAR(50) RETURNING id;';

const provider = async (roleName: string) => {
  try {
    const result = await db.query(SQL_DELETE_ROLE, [roleName]);
    if (!result.rowCount) return 0;
    return result.rows[0].id;
  } catch (error: any) {
    if (error.code === FK_ERR_CODE) throw new AppError(errDef[403].RoleHasUsers);
    throw error;
  }
};

export default provider;
