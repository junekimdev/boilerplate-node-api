import db from '../../utils/db';
import { AppError, errDef } from '../../utils/errors';

const SQL_GET_ROLE = 'SELECT id FROM user_role WHERE name=$1::VARCHAR(50);';

const SQL_UPDATE_ROLE = 'UPDATE userpool SET role_id=$1::INT WHERE id=$2::INT RETURNING id;';

const provider = async (userIds: number[], newRole: string) =>
  await db.transaction(async (client) => {
    const roleQuery = await client.query(SQL_GET_ROLE, [newRole]);
    if (!roleQuery.rowCount) throw new AppError(errDef[404].RoleNotFound);

    const roleId = roleQuery.rows[0].id as number;

    for (let i = 0; i < userIds.length; i++) {
      const result = await client.query(SQL_UPDATE_ROLE, [roleId, userIds[i]]);
      if (!result.rowCount) throw new AppError(errDef[404].UserNotFound);
    }

    return userIds.length;
  });

export default provider;
