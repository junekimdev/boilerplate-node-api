import webpush, { PushSubscription, RequestOptions } from 'web-push';
import db from './db';

const ALL = 'all';
const { VAPID_SUBJECT = '', VAPID_PUB_KEY = '', VAPID_PRI_KEY = '' } = process.env;
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUB_KEY, VAPID_PRI_KEY);

type SubRow = {
  id: number;
  sub: string;
};

const GET_ALL_SQL = `SELECT (id, sub) FROM push_subscription`;
const GET_BY_TOPIC_SQL = 'SELECT (id, sub) FROM push_subscription WHERE topic=($1::VARCHAR(20))';
const DELETE_SQL = `DELETE FROM push_subscription WHERE id=($1::INT)`;

export async function* getSubsByTopicFromDB(topic: string) {
  const result =
    topic === ALL ? await db.query(GET_ALL_SQL) : await db.query(GET_BY_TOPIC_SQL, [topic]);
  for (let subRow of result.rows) yield subRow as SubRow;
}

const sendNotiByTopic = async (
  topic: string,
  payload?: string | Buffer | null,
  options?: RequestOptions,
) => {
  for await (let subRow of getSubsByTopicFromDB(topic)) {
    const { id, sub } = subRow;
    try {
      const subObj = JSON.parse(sub);
      await webpush.sendNotification(subObj, payload, options);
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await db.query(DELETE_SQL, [id]);
      } else {
        throw err;
      }
    }
  }
};

const sendNotiToAll = async (payload?: string | Buffer | null, options?: RequestOptions) => {
  await sendNotiByTopic(ALL, payload, options);
};

export default { sendNotiToAll, sendNotiByTopic };
