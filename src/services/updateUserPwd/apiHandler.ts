import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IReqBody, IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = res.locals as IResLocals;

    const { password } = req.body as IReqBody;
    if (typeof password !== 'string') throw new AppError(errDef[400].invalidPassword);
    if (password === '') throw new AppError(errDef[400].invalidPassword);

    const result = await provider(userId, password);
    if (!result) throw new AppError(errDef[404].UserNotFound);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export default handler;
