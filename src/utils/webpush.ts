import webpush, { PushSubscription, RequestOptions, WebPushError } from 'web-push';
import db from './db';
import { logger } from './logger';

type SubscriptionRow = {
  id: number;
  sub: string;
};

export const ALL = 'all';
const { VAPID_SUBJECT = '', VAPID_PUB_KEY = '', VAPID_PRI_KEY = '' } = process.env;
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUB_KEY, VAPID_PRI_KEY);

const SQL_GET_ALL = `SELECT (id, sub) FROM subscription`;
const SQL_GET_BY_TOPIC = `SELECT (id, sub) FROM subscription
WHERE topic_id=(SELECT id FROM topic WHERE name=$1::VARCHAR(50))`;
const SQL_DELETE = `DELETE FROM subscription WHERE id IN ($1::INT[])`;

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
  let successCount = 0;
  const subsTodelete = [];
  const errors = []; // This collects errors during sending process and rethrows at the end

  // Send noti
  for await (let row of getSubsByTopicFromDB(topic)) {
    const { id, sub } = row;
    try {
      const subObj: PushSubscription = JSON.parse(sub);
      await webpush.sendNotification(subObj, payload, options);
      successCount++;
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        subsTodelete.push(id);
      } else {
        errors.push(err);
      }
    }
  }
  logger.info(`[WebPush Info] ${successCount} noti was sent successfully by topic <${topic}>`);

  // Delete unsubscribers
  if (subsTodelete.length) {
    await db.query(SQL_DELETE, subsTodelete);
    logger.info(`[WebPush Info] ${subsTodelete.length} sub was deleted in topic <${topic}>`);
  }

  // Throw one error with errors combined if error exists
  if (errors.length) {
    const msg = `[WebPush Error] ${errors.length} errors occurred in sending by topic <${topic}>`;
    logger.error(msg);
    errors.forEach((err) => logger.error((err as Error).message));
    throw new Error('WebPush Error', { cause: errors });
  }
};

export const sendNotiToAll = async (payload?: string | Buffer | null, options?: RequestOptions) => {
  await sendNotiByTopic(ALL, payload, options);
};

export const isValidSub = (subscription: any) => {
  try {
    const n =
      subscription.endpoint.length &&
      subscription.keys.auth.length &&
      subscription.keys.p256dh.length;
    return n !== 0;
  } catch (error) {
    return false;
  }
};

export const isValidTopic = (topic: any) => {
  return typeof topic === 'string' && 0 < topic.length && topic.length <= 50;
};

export default { sendNotiToAll, sendNotiByTopic };
