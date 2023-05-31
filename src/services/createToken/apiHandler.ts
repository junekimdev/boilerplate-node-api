import { NextFunction, Request, Response } from 'express';
import provider from './provider';
import { IResBody, IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, email } = res.locals as IResLocals;

    // Provide
    const resBody: IResBody = await provider(userId, email);
    res.status(201).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
