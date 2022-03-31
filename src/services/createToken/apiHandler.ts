import { Request, Response, NextFunction } from 'express';
import provider from './provider';
import { IResLocals, IResBody } from './types';
//import { errDef, AppError } from '../../utils';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, email } = res.locals as IResLocals;

    // Provide
    const token = await provider(userId, email);
    const resBody: IResBody = { access_token: token };
    res.status(201).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
