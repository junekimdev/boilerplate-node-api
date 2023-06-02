import { NextFunction, Request, Response } from 'express';
import { AccessControlRow, getRow, requestAccess } from '../utils/access';
import { IResLocals } from './bearerAuth';

const access = async (req: Request, res: Response, next: NextFunction) => {
  const reqs: AccessControlRow[] = [
    getRow('topic', true, false),
    getRow('subscription', false, true),
  ];
  (res.locals as IResLocals).accessRegex = requestAccess(reqs);
  next();
};

export default access;
