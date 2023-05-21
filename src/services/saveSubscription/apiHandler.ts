import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils';
import provider from './provider';
import { IReqBody, ISubscription } from './types';

const isValid = (subscription: ISubscription) => {
  try {
    const n =
      subscription.endpoint.length &&
      subscription.keys.auth.length &&
      subscription.keys.p256dh.length;
    return n !== 0;
  } catch (error) {
    return false;
  }
};

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subscription } = req.body as IReqBody;

    // Check validity
    if (!isValid(subscription)) throw new AppError(errDef[400].InvalidSubscription);

    // Provide
    await provider(subscription);
    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};

export default handler;
