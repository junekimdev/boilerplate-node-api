import db from '../../utils/db';

const SQL_GET_RES = 'SELECT * FROM resource';

const provider = async () => {
  const res = await db.query(SQL_GET_RES);
  return res.rows;
};

export default provider;
