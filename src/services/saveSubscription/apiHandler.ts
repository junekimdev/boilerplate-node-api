import { NextFunction, Request, Response } from 'express';
import { PushSubscription } from 'web-push';
import { AppError, errDef } from '../../utils';
import provider from './provider';
import { IReqBod } from './types';

const isValidSub = (subscription: PushSubscription) => {
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

const isValidTopic = (topic: string) => {
  try {
    return topic.length < 20;
  } catch (error) {
    return false;
  }
};

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, subscription } = req.body as IReqBody;

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
