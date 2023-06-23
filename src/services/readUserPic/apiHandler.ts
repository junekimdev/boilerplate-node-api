import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = res.locals as IResLocals;

    const { PUBLIC_PROFILE_DIR = '/images/profiles' } = process.env;

    const result = await provider(userId);
    if (result === '') throw new AppError(errDef[404].UserNotFound);
    if (result === null) {
      res.sendStatus(204);
    } else {
      const profile_url = path.join(PUBLIC_PROFILE_DIR, result);
      res.status(200).json({ profile_url });
    }
  } catch (error) {
    next(error);
  }
};

export default handler;
