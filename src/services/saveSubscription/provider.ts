import { PushSubscription } from 'web-push';
import db from '../../utils/db';

const SQL_CHECK_TOPIC = `SELECT id
FROM push_sub_topics
WHERE topic=$1::VARCHAR(20);`;

const SQL_CHECK_SUB = `SELECT id
FROM push_subscription
WHERE sub=$1::TEXT;`;

const SQL_INSERT = `INSERT INTO push_subscription(sub, topic_id)
SELECT ($1::TEXT, (SELECT id FROM push_sub_topics WHERE topic=$2::VARCHAR(20));`;

const provider = async (subscription: PushSubscription, topic: string) => {
  const sub = JSON.stringify(subscription);
  const result = await db.transaction(async (client) => {
    const result_topic = await client.query(SQL_CHECK_TOPIC, [topic]); // Check if topic exists
    if (!result_topic.rowCount) return false; // topic doesn't exists

    const result_sub = await client.query(SQL_CHECK_SUB, [sub]); // Check if sub already exists
    if (result_sub.rowCount) return true; // sub already exists, no need to insert

    await client.query(SQL_INSERT, [sub, topic]);
    return true;
  });

  return result;
};

export default provider;
