import db from '../../utils/db';
import hash from '../../utils/hash';

export const SQL_INSERT_USER = `INSERT INTO userpool(email, pw, salt, role_id, surname, given_name)
SELECT
$1::VARCHAR(50), $2::CHAR(44), $3::CHAR(16),
(SELECT id FROM user_role WHERE name=$4::VARCHAR(50)),
$5::TEXT, $6::TEXT
ON CONFLICT (email) DO NOTHING
RETURNING id;`;

const provider = async (
  email: string,
  password: string,
  roleName: string,
  surname: string,
  givenName: string,
) => {
  const salt = hash.createSalt();
  const hashed = await hash.passSalt(password, salt);

  const result = await db.query(SQL_INSERT_USER, [
    email,
    hashed,
    salt,
    roleName,
    surname,
    givenName,
  ]);
  return result.rowCount ? (result.rows[0].id as number) : 0;
};

export default provider;
