import { NextFunction, Request, Response } from 'express';
import provider from './provider';
import { IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, roleName } = res.locals as IResLocals;

    const id = await provider(userId, roleName);
    res.status(200).json({ user_id: id });
  } catch (error) {
    next(error);
  }
};

export default handler;
