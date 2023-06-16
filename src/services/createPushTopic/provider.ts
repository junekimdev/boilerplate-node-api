import db from '../../utils/db';

const SQL_INSERT_TOPIC = `INSERT INTO topic(name)
VALUES ($1::VARCHAR(50))
ON CONFLICT DO NOTHING
RETURNING id;`;

const provider = async (topicName: string) => {
  const result = await db.query(SQL_INSERT_TOPIC, [topicName]);
  if (!result.rowCount) return 0;
  return result.rows[0].id as number;
};

export default provider;
