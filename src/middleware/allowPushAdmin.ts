import { NextFunction, Request, Response } from 'express';
import { AccessControlRow, getRow, requestAccess } from '../utils/access';
import { IBearerAuthResLocals } from './bearerAuth';

const access = async (req: Request, res: Response, next: NextFunction) => {
  const reqs: AccessControlRow[] = [
    getRow('topic', true, true),
    getRow('subscription', true, true),
  ];
  (res.locals as IBearerAuthResLocals).accessRegex = requestAccess(reqs);
  next();
};

export default access;
