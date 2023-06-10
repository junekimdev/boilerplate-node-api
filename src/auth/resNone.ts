import { NextFunction, Request, Response } from 'express';
import { AccessControlRow, requestAccess } from '../utils/access';
import { IBearerAuthResLocals } from './bearerAuth';

const access = async (req: Request, res: Response, next: NextFunction) => {
  (res.locals as IBearerAuthResLocals).accessRegex = requestAccess([]);
  next();
};

export default access;
