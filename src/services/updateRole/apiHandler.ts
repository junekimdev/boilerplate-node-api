import { NextFunction, Request, Response } from 'express';
import { isValidPermit } from '../../utils/access';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IReqBody, IResLocals } from './types';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roleName } = res.locals as IResLocals;
    const { update_data } = req.body as IReqBody;

    // Validate data
    if (update_data === undefined) throw new AppError(errDef[404].DataNotFound);

    const { role_name, permissions } = update_data;
    if (typeof role_name !== 'string') throw new AppError(errDef[400].InvalidRoleName);

    if (!Array.isArray(permissions)) throw new AppError(errDef[400].InvalidRolePermission);
    permissions.forEach((permit) => {
      if (!isValidPermit(permit)) throw new AppError(errDef[400].InvalidRolePermission);
    });

    const newName = role_name;
    const id = await provider(roleName, newName, permissions);
    if (!id) throw new AppError(errDef[409].RoleAlreadyExists);
    res.status(200).json({ role_id: id });
  } catch (error) {
    next(error);
  }
};

export default handler;
