import { NextFunction, Request, Response } from 'express';
import db from '../utils/db';
import { AppError, errDef } from '../utils/errors';

const SQL_GET_ROLES = 'SELECT id FROM user_role WHERE name=$1::VARCHAR(50);';

const param = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role_name } = req.body;
    if (typeof role_name !== 'string') throw new AppError(errDef[400].InvalidRoleName);

    // Check if role is valid
    const roleTable = await db.query(SQL_GET_ROLES, [role_name]);
    if (!roleTable.rowCount) throw new AppError(errDef[400].InvalidRoleName);

    res.locals.roleName = role_name;
    next();
  } catch (error) {
    next(error);
  }
};

export default param;
