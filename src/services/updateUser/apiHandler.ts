import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IReqBody, IResLocals, IUserInfo } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { decodedToken } = res.locals as IResLocals;
    const { user_id } = decodedToken;
    if (typeof user_id !== 'number') throw new AppError(errDef[401].InvalidToken);

    const { surname, given_name } = req.body as IReqBody;
    const info: IUserInfo = {
      id: user_id,
      surname,
      given_name,
    };

    const result = await provider(info);
    if (!result) throw new AppError(errDef[404].UserNotFound);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export default handler;
