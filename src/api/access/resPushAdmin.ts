import { NextFunction, Request, Response } from 'express';
import { AccessControlRow, getRow, requestAccess } from '../../utils/access';
import { IResLocals } from '../bearerAuth';

const access = async (req: Request, res: Response, next: NextFunction) => {
  const reqs: AccessControlRow[] = [
    getRow('topic', true, true),
    getRow('subscription', true, true),
  ];
  (res.locals as IResLocals).accessRegex = requestAccess(reqs);
};

export default access;
