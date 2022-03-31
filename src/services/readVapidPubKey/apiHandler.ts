import { Request, Response, NextFunction } from 'express';
import { IResBody } from './types';
import { AppError } from '../../utils';

const { VAPID_PUB_KEY } = process.env;

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!VAPID_PUB_KEY) throw new AppError();
    const resBody: IResBody = { key: VAPID_PUB_KEY };
    res.status(200).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
