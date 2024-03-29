import { SQL_INSERT_PERMIT } from '../../services/createRole/provider';
import { IPermission } from '../../utils/access';
import db from '../../utils/db';
import { UK_ERR_CODE } from '../../utils/errors';

const SQL_GET_ROLE_ID = 'SELECT id FROM user_role WHERE name=$1::VARCHAR(50);';

const SQL_UPDATE_ROLENAME = 'UPDATE user_role SET name=$2::VARCHAR(50) WHERE id=$1::INT;';

const SQL_DELETE_PERMIT = 'DELETE FROM access_control WHERE role_id=$1::INT;';

const provider = async (oldName: string, newName: string, permissions: IPermission[]) =>
  db.transaction(async (client) => {
    const roleQuery = await client.query(SQL_GET_ROLE_ID, [oldName]);
    const roleId = roleQuery.rows[0].id as number;

    // Update name if it's different
    if (oldName !== newName) {
      try {
        await client.query(SQL_UPDATE_ROLENAME, [roleId, newName]);
      } catch (error: any) {
        if (error.code === UK_ERR_CODE) return 0;
        throw error;
      }
    }

    // Delete all permits in the role
    await client.query(SQL_DELETE_PERMIT, [roleId]);

    // Insert new permissions
    for (let i = 0; i < permissions.length; i++) {
      const { res_name, readable, writable } = permissions[i];
      await client.query(SQL_INSERT_PERMIT, [roleId, res_name, readable, writable]);
    }

    return roleId;
  });

export default provider;
