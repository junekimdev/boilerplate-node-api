import db from '../../utils/db';
import { AppError, NULL_ERR_CODE, UK_ERR_CODE, errDef } from '../../utils/errors';
import hash from '../../utils/hash';

export const SQL_INSERT_USER = `INSERT INTO userpool(email, pw, salt, role_id, surname, given_name)
SELECT
$1::VARCHAR(50), $2::CHAR(44), $3::CHAR(16),
(SELECT id FROM user_role WHERE name=$4::VARCHAR(50)),
$5::TEXT, $6::TEXT
RETURNING id;`;

const provider = async (
  email: string,
  password: string,
  roleName: string,
  surname: string,
  givenName: string,
) => {
  const salt = hash.createSalt();
  const hashed = hash.passSalt(password, salt);
  const params = [email, hashed, salt, roleName, surname, givenName];

  try {
    const result = await db.query(SQL_INSERT_USER, params);
    return result.rows[0].id as number;
  } catch (error: any) {
    if (error.code === NULL_ERR_CODE) throw new AppError(errDef[404].RoleNotFound);
    if (error.code === UK_ERR_CODE) throw new AppError(errDef[409].UserAlreadyExists);
    throw error;
  }
};

export default provider;
