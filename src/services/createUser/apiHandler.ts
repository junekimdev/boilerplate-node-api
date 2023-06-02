import { NextFunction, Request, Response } from 'express';
import { AppError, errDef, isEmailValid } from '../../utils';
import provider from './provider';
import { IReqBody, IResBody } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as IReqBody;

    // Check validity
    if (!isEmailValid(email)) throw new AppError(errDef[400].InvalidEmailFormat);

    // Provide
    const id = await provider(email, password);
    const resBody: IResBody = { user_id: id };
    res.status(201).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
