import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils';
import provider from './provider';
import { IReqBody } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, payload } = req.body as IReqBody;
    topic = topic.toLowerCase().trim();
    if (!topic) throw new AppError(errDef[400].InvalidPushTopic);
    if (!payload) throw new AppError(errDef[400].InvalidPayload);

    await provider(topic, payload);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export default handler;
