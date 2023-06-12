import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { AppError, errDef } from '../utils/errors';
import { IBearerAuthResLocals } from './bearerAuth';

const param = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.body;

    // Set ID if undefine
    let userId: number;
    if (user_id === undefined) {
      const { decodedToken } = res.locals as IBearerAuthResLocals;
      if (decodedToken === undefined) throw new AppError();
      if (typeof decodedToken.user_id !== 'number') throw new AppError(errDef[401].InvalidToken);
      userId = decodedToken.user_id;
    } else {
      if (typeof user_id !== 'number') throw new AppError(errDef[400].invalidUserId);
      userId = user_id;
    }

    res.locals.userId = userId;
    next();
  } catch (error) {
    next(error);
  }
};

export default param;
