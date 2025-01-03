import { NextFunction, Request, Response } from 'express';
import { requestAccess } from '../utils/access';

const access = async (req: Request, res: Response, next: NextFunction) => {
  res.locals.accessRegex = requestAccess();
  next();
};

export default access;
