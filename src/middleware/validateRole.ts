import { NextFunction, Request, Response } from 'express';
import { AppError, errDef } from '../utils/errors';

const param = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role_name } = req.body;
    if (typeof role_name !== 'string') throw new AppError(errDef[400].InvalidRoleName);

    res.locals.roleName = role_name;
    next();
  } catch (error) {
    next(error);
  }
};

export default param;
