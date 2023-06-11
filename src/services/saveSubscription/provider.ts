import { PushSubscription } from 'web-push';
import db from '../../utils/db';

const SQL_INSERT = `INSERT INTO subscription(sub, topic_id)
SELECT $1::TEXT, (SELECT id FROM topic WHERE name=$2::VARCHAR(50))
ON CONFLICT (sub) DO NOTHING
RETURNING id;`;

const provider = async (subscription: PushSubscription, topic: string) => {
  const sub = JSON.stringify(subscription);
  const result = await db.query(SQL_INSERT, [sub, topic]);
  return result.rowCount;
};

export default provider;
