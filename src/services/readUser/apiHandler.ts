import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = res.locals as IResLocals;

    const resBody = await provider(userId);
    if (!resBody) throw new AppError(errDef[404].UserNotFound);
    res.status(200).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
