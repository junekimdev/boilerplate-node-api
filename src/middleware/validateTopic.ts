import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../utils/errors';

const param = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic_name } = req.body;
    if (typeof topic_name !== 'string') throw new AppError(errDef[400].InvalidPushTopic);

    res.locals.topicName = topic_name;
    next();
  } catch (error) {
    next(error);
  }
};

export default param;
