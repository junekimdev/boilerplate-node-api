import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await provider();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default handler;
