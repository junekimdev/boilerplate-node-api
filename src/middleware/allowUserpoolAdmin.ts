import { NextFunction, Request, Response } from 'express';
import { AccessControlRow, getRow, requestAccess } from '../utils/access';

const access = async (req: Request, res: Response, next: NextFunction) => {
  const rows: AccessControlRow[] = [getRow('userpool', true, true)];
  res.locals.accessRegex = requestAccess(rows);
  next();
};

export default access;
