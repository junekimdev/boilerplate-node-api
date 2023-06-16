import db from '../../utils/db';

const SQL_DELETE_TOPIC = 'DELETE FROM topic WHERE name=$1::VARCHAR(50) RETURNING id;';

const provider = async (topicName: string) => {
  const result = await db.query(SQL_DELETE_TOPIC, [topicName]);
  if (!result.rowCount) return 0;
  return result.rows[0].id as number;
};

export default provider;
