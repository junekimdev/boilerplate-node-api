import { NextFunction, Request, Response } from 'express';
import { IBasicAuthResLocals } from '../../middleware/basicAuth';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IReqBody, IResBody } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, email } = res.locals as IBasicAuthResLocals;
    const { device } = req.body as IReqBody;
    if (typeof device !== 'string') throw new AppError(errDef[400].InvalidDeviceId);

    const resBody: IResBody = await provider(userId, email, device);
    res.status(201).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
