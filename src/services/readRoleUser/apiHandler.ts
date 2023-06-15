import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roleName } = res.locals as IResLocals;

    const result = await provider(roleName);
    if (result === 0) throw new AppError(errDef[404].RoleNotFound);

    res.status(200).json({ user_ids: result });
  } catch (error) {
    next(error);
  }
};

export default handler;
