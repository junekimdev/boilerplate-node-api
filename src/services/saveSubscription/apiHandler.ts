import { NextFunction, Request, Response } from 'express';
import db from '../../utils/db';
import { AppError, errDef } from '../../utils/errors';
import { isValidSub, isValidTopic } from '../../utils/webpush';
import provider from './provider';
import { IReqBody } from './types';

const SQL_CHECK_TOPIC = `SELECT id FROM topic WHERE name=$1::VARCHAR(50);`;

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, subscription } = req.body as IReqBody;

    // Check validity
    if (!isValidSub(subscription)) throw new AppError(errDef[400].InvalidPushSubscription);
    if (!isValidTopic(topic)) throw new AppError(errDef[400].InvalidPushTopic);

    const queryTopic = await db.query(SQL_CHECK_TOPIC, [topic]);
    if (!queryTopic.rowCount) throw new AppError(errDef[400].InvalidPushTopic); // Topic doesn't exist

    // Provide
    const result = await provider(subscription, topic);
    if (!result) throw new AppError(errDef[409].PushSubscriptionAlreadyExists);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export default handler;
