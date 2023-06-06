import { PushSubscription } from 'web-push';
import db from '../../utils/db';

const SQL_INSERT = `INSERT INTO push_subscription(sub, topic_id)
SELECT $1::TEXT, (SELECT id FROM push_sub_topics WHERE topic=$2::VARCHAR(20))
ON CONFLICT (sub) DO NOTHING;`;

const provider = async (subscription: PushSubscription, topic: string) => {
  const sub = JSON.stringify(subscription);
  await db.query(SQL_INSERT, [sub, topic]);
};

export default provider;
