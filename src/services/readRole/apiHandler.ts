import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roleName } = res.locals as IResLocals;
    const resBody = await provider(roleName);
    res.status(200).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;