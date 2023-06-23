import db from '../../utils/db';

const SQL_GET_PIC = 'SELECT profile_url FROM userpool WHERE id=$1::INT;';

const provider = async (userId: number) => {
  const result = await db.query(SQL_GET_PIC, [userId]);
  if (!result.rowCount) return '';
  return result.rows[0].profile_url as string | null;
};

export default provider;
