import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IReqBody, IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topicName } = res.locals as IResLocals;
    const { update_data } = req.body as IReqBody;

    // Validate
    if (update_data === undefined || update_data.constructor !== Object)
      throw new AppError(errDef[400].InvalidData);

    const { topic_name } = update_data;
    if (typeof topic_name !== 'string') throw new AppError(errDef[400].InvalidPushTopic);

    const result = await provider(topicName, topic_name);
    res.status(200).json({ topic_id: result });
  } catch (error) {
    next(error);
  }
};

export default handler;
