import db from '../../utils/db';

const SQL_DELETE_USER = `DELETE FROM userpool WHERE id=$1::INT RETURNING id;`;

const provider = async (userId: number) => {
  const result = await db.query(SQL_DELETE_USER, [userId]);
  return result.rowCount ? (result.rows[0].id as number) : 0;
};

export default provider;
