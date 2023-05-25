import webpush, { PushSubscription, RequestOptions, WebPushError } from 'web-push';
import db from './db';

type SubscriptionRow = {
  id: number;
  sub: string;
};

export const ALL = 'all';
const { VAPID_SUBJECT = '', VAPID_PUB_KEY = '', VAPID_PRI_KEY = '' } = process.env;
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUB_KEY, VAPID_PRI_KEY);

const SQL_GET_ALL = `SELECT (id, sub) FROM push_subscription`;
const SQL_GET_BY_TOPIC = 'SELECT (id, sub) FROM push_subscription WHERE topic=($1::VARCHAR(20))';
const SQL_DELETE = `DELETE FROM push_subscription WHERE id=($1::INT)`;

export async function* getSubsByTopicFromDB(topic: string) {
  const result =
    topic === ALL ? await db.query(SQL_GET_ALL) : await db.query(SQL_GET_BY_TOPIC, [topic]);
  for (let row of result.rows) yield row as SubscriptionRow;
}

export const sendNotiByTopic = async (
  topic: string,
  payload?: string | Buffer | null,
  options?: RequestOptions,
) => {
  for await (let row of getSubsByTopicFromDB(topic)) {
    const { id, sub } = row;
    try {
      const subObj: PushSubscription = JSON.parse(sub);
      await webpush.sendNotification(subObj, payload, options);
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await db.query(SQL_DELETE, [id]);
      } else {
        throw err;
      }
    }
  }
};

export const sendNotiToAll = async (payload?: string | Buffer | null, options?: RequestOptions) => {
  await sendNotiByTopic(ALL, payload, options);
};

export default { sendNotiToAll, sendNotiByTopic };
