import { NextFunction, Request, Response } from 'express';
import { isValidPermit } from '../../utils/access';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IReqBody } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role_name, permissions } = req.body as IReqBody;

    // Validate
    if (typeof role_name !== 'string') throw new AppError(errDef[400].InvalidRoleName);
    if (!Array.isArray(permissions)) throw new AppError(errDef[400].InvalidRolePermission);
    permissions.forEach((permit) => {
      if (!isValidPermit(permit)) throw new AppError(errDef[400].InvalidRolePermission);
    });

    const result = await provider(role_name, permissions);
    if (!result) throw new AppError(errDef[409].RoleAlreadyExists);
    res.status(201).json({ role_id: result });
  } catch (error) {
    next(error);
  }
};

export default handler;
