import { NextFunction, Request, Response } from 'express';
import { IResLocals } from '../api/bearerAuth';
import { AccessControlRow, getRow, requestAccess } from '../utils/access';

const access = async (req: Request, res: Response, next: NextFunction) => {
  const reqs: AccessControlRow[] = [
    getRow('topic', true, false),
    getRow('subscription', false, true),
  ];
  (res.locals as IResLocals).accessRegex = requestAccess(reqs);
};

export default access;
