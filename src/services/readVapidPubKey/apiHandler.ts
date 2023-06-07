import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/errors';
import { IResBody } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { VAPID_PUB_KEY } = process.env;
    if (!VAPID_PUB_KEY) throw new AppError();

    const resBody: IResBody = { key: VAPID_PUB_KEY };
    res.status(200).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
