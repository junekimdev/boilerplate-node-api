import { NextFunction, Request, Response } from 'express';
import { IBearerAuthResLocals } from '../../auth/bearerAuth';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { decodedToken } = res.locals as IResLocals;
    const { user_id } = decodedToken;
    if (typeof user_id !== 'number') throw new AppError(errDef[401].InvalidToken);
    const userId = user_id; // change snake_case to camelCase

    const resBody = await provider(userId);
    if (!resBody) throw new AppError(errDef[404].UserNotFound);
    res.status(200).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
