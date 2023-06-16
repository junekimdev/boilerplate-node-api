import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IReqBody, IResLocals, IUserInfo } from './types';

export const invalidString = (data: any) => data !== undefined && typeof data !== 'string';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = res.locals as IResLocals;
    const { update_data } = req.body as IReqBody;

    // Validate
    if (update_data === undefined || update_data.constructor !== Object)
      throw new AppError(errDef[400].InvalidData);

    const { surname, given_name } = update_data;
    if (invalidString(surname)) throw new AppError(errDef[400].InvalidData);
    if (invalidString(given_name)) throw new AppError(errDef[400].InvalidData);

    // Pack info to pass to provider
    const newInfo: IUserInfo = { userId, surname, given_name };

    const result = await provider(newInfo);
    if (!result) throw new AppError(errDef[404].UserNotFound);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export default handler;
