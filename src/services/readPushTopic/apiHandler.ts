import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IResBody, IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topicName } = res.locals as IResLocals;

    const result = await provider(topicName);
    if (!result) throw new AppError(errDef[404].TopicNotFound);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default handler;
