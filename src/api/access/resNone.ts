import { NextFunction, Request, Response } from 'express';
import { AccessControlRow, requestAccess } from '../../utils/access';
import { IResLocals } from '../bearerAuth';

const access = async (req: Request, res: Response, next: NextFunction) => {
  (res.locals as IResLocals).accessRegex = requestAccess([]);
};

export default access;
