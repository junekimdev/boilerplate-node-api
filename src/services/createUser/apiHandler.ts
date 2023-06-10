import { NextFunction, Request, Response } from 'express';
import roles from '../../auth/roles';
import db from '../../utils/db';
import { isEmailValid } from '../../utils/email';
import { AppError, errDef } from '../../utils/errors';
import provider from './provider';
import { IReqBody, IResBody } from './types';

const SQL_CHECK_EMAIL = `SELECT id FROM userpool WHERE email=$1::VARCHAR(50)`;

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as IReqBody;
    const { role } = req.params;

    // Check validity
    // Check if role is valid
    if (!roles.includes(role)) throw new AppError(errDef[400].invalidRoleName);

    // Check if email is valid
    if (!isEmailValid(email)) throw new AppError(errDef[400].InvalidEmailFormat);
    const validEmail = email.toLowerCase().trim();

    // Check if email already exists
    const result = await db.query(SQL_CHECK_EMAIL, [validEmail]);
    if (result.rowCount) throw new AppError(errDef[409].UserAlreadyExists);

    // Provide
    const id = await provider(validEmail, password, role);
    const resBody: IResBody = { user_id: id };
    res.status(201).json(resBody);
  } catch (error) {
    next(error);
  }
};

export default handler;
