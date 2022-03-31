import { Request, Response, NextFunction } from 'express';
import provider from './provider';
import { IReqBody } from './types';
import { errDef, AppError } from '../../utils';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { payload } = req.body as IReqBody;
    if (!payload) throw new AppError(errDef[400].InvalidPayload);
    await provider(payload);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export default handler;
