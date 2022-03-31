import { Request, Response, NextFunction } from 'express';
import provider from './provider';
import { IReqBody, IResBody } from './types';
import { errDef, AppError, isEmailValid } from '../../utils';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as IReqBody;

    // Check validity
    if (!isEmailValid(email))
      throw new AppError(errDef[400].InvalidEmailFormat);
    if (email.length > 50) throw new AppError(errDef[406].EmailTooLong);

    // Provide
    const id = await provider(email, password);
    const resBody: IResBody = { user_id: id };
    res.status(201).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
