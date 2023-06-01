import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IReqBody } from './types';

export const isValidTopic = (topic: any) => {
  try {
    return 0 < topic.length && topic.length <= 50;
  } catch (error) {
    return false;
  }
};

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { topic, payload } = req.body as IReqBody;
    if (typeof topic === 'string') topic = topic.toLowerCase().trim();
    if (!isValidTopic(topic)) throw new AppError(errDef[400].InvalidPushTopic);
    if (!payload) throw new AppError(errDef[400].InvalidPayload);

    await provider(topic, payload);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export default handler;
