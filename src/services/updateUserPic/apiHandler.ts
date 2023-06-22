import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, uploadedImagePaths } = res.locals as IResLocals;

    const result = await provider(userId, uploadedImagePaths[0]);
    if (!result) throw new AppError(errDef[404].UserNotFound);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export default handler;
