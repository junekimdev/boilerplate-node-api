import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IResBody, IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, email } = res.locals as IResLocals;
    const { device } = req.body;
    if (!device) throw new AppError(errDef[400].DeviceIdNotFound);

    // Provide
    const resBody: IResBody = await provider(userId, email, device);
    res.status(201).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
