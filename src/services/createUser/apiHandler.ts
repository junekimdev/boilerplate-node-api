import { NextFunction, Request, Response } from 'express';
import db from '../../utils/db';
import { isEmailValid } from '../../utils/email';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IReqBody, IResBody, IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, surname, given_name } = req.body as IReqBody;
    const { roleName } = res.locals as IResLocals;

    // Check validity
    // Check if email is valid
    if (!isEmailValid(email)) throw new AppError(errDef[400].InvalidEmailFormat);
    const validEmail = email.toLowerCase().trim();

    // Provide
    const id = await provider(validEmail, password, roleName, surname, given_name);
    if (!id) throw new AppError(errDef[409].UserAlreadyExists);
    const resBody: IResBody = { user_id: id };
    res.status(201).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
