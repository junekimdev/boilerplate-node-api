import { NextFunction, Request, Response } from 'express';
import { IResLocals } from '../api/bearerAuth';
import { AccessControlRow, requestAccess } from '../utils/access';

const access = async (req: Request, res: Response, next: NextFunction) => {
  (res.locals as IResLocals).accessRegex = requestAccess([]);
};

export default access;
