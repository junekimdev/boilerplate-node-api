import db from '../../utils/db';
import hash from '../../utils/hash';

const SQL_UPDATE_PWD = `UPDATE userpool SET (pw, salt)=($2::CHAR(44), $3::CHAR(16))
WHERE id=$1::INT RETURNING id;`;

const provider = async (userId: number, password: string) => {
  const salt = hash.createSalt();
  const hashed = hash.passSalt(password, salt);

  const result = await db.query(SQL_UPDATE_PWD, [userId, hashed, salt]);
  return result.rowCount;
};

export default provider;
