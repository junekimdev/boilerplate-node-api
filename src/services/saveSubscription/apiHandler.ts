import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IReqBody } from './types';

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

export const isValidTopic = (topic: string) => {
  return 0 < topic.length && topic.length <= 50;
};

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { topic, subscription } = req.body as IReqBody;

    // Check validity
    if (!isValidSub(subscription)) throw new AppError(errDef[400].InvalidPushSubscription);
    topic = topic.toLowerCase().trim();
    if (!isValidTopic(topic)) throw new AppError(errDef[400].InvalidPushTopic);

    // Provide
    const result = await provider(subscription, topic);
    if (result) {
      res.sendStatus(200);
    } else {
      throw new AppError(errDef[400].InvalidPushTopic);
    }
  } catch (error) {
    next(error);
  }
};

export default handler;
