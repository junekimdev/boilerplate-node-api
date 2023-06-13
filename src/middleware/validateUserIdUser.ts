import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { AppError, errDef } from '../utils/errors';
import { IBearerAuthResLocals } from './bearerAuth';

const param = async (req: Request, res: Response, next: NextFunction) => {
  try {
    delete req.body.user_id;

    const { decodedToken } = res.locals as IBearerAuthResLocals;
    if (decodedToken === undefined) throw new AppError();
    if (typeof decodedToken.user_id !== 'number') throw new AppError(errDef[401].InvalidToken);

    res.locals.userId = decodedToken.user_id;
    next();
  } catch (error) {
    next(error);
  }
};

export default param;
