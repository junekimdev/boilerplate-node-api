import db from '../../utils/db';

const SQL_GET_TOPIC = `SELECT id as topic_id, name as topic_name, created_at
FROM topic WHERE name=$1::VARCHAR(50);`;

const provider = async (topicName: string) => {
  const result = await db.query(SQL_GET_TOPIC, [topicName]);
  if (!result.rowCount) return 0;
  return result.rows[0];
};

export default provider;
