import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roleName } = res.locals as IResLocals;
    const { user_ids } = req.body;
    if (!Array.isArray(user_ids)) throw new AppError(errDef[400].InvalidUserId);
    user_ids.forEach((id) => {
      if (typeof id !== 'number') throw new AppError(errDef[400].InvalidUserId);
    });

    const result = await provider(user_ids, roleName);

    res.status(200).json({ updated: result });
  } catch (error) {
    next(error);
  }
};

export default handler;
