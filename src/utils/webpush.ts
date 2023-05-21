import webpush, { PushSubscription, RequestOptions } from 'web-push';
import db from './db';

const { VAPID_SUBJECT = '', VAPID_PUB_KEY = '', VAPID_PRI_KEY = '' } = process.env;
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUB_KEY, VAPID_PRI_KEY);

type SubRow = {
  id: number;
  sub: string;
};

const SELECT_SQL = `SELECT * FROM push_sub`;
const DELETE_SQL = `DELETE FROM push_sub WHERE id = ($1::INT)`;

async function* getAllSubsFromDB() {
  const result = await db.query(SELECT_SQL);
  for (let subRow of result.rows) yield subRow as SubRow;
}

const sendNotification = async (payload?: string | Buffer | null, options?: RequestOptions) => {
  for await (let subRow of getAllSubsFromDB()) {
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

export default { sendNotification };
