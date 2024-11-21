import { IPermission } from '../../utils/access';
import db from '../../utils/db';

export const SQL_INSERT_ROLE = `INSERT INTO user_role(name)
VALUES ($1::VARCHAR(50))
ON CONFLICT DO NOTHING
RETURNING id;`;

export const SQL_INSERT_PERMIT = `INSERT INTO access_control(role_id, resource_id, readable, writable)
SELECT $1::INT, (SELECT id FROM resource WHERE name=$2::VARCHAR(50)), $3::BOOLEAN, $4::BOOLEAN
RETURNING role_id;`;

const provider = async (roleName: string, permissions: IPermission[]) => {
  return await db.transaction(async (client) => {
    const roleInsert = await client.query(SQL_INSERT_ROLE, [roleName]);
    if (!roleInsert.rowCount) return 0;
    const roleId = roleInsert.rows[0].id as number;

    for (let i = 0; i < permissions.length; i++) {
      const { res_name, readable, writable } = permissions[i];
      await client.query(SQL_INSERT_PERMIT, [roleId, res_name, readable, writable]);
    }

    return roleId;
  });
};

export default provider;
