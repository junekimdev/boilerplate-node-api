import { NextFunction, Request, Response } from 'express';
import { QueryResultRow } from 'pg';
import db from '../utils/db';
import { isEmailValid } from '../utils/email';
import { AppError, errDef } from '../utils/errors';
import hash from '../utils/hash';

interface ICredential {
  username: string; // username is user's email
  password: string | undefined;
}

interface IUserpoolRow extends QueryResultRow {
  id: number;
  pw: string;
  salt: string;
}

export interface IBasicAuthResLocals {
  userId: number;
  email: string;
}

export const decodeCredential = (cred: string) => {
  const buf = Buffer.from(cred, 'base64');
  const decoded = buf.toString('utf8');
  const [username, password] = decoded.split(':');
  return { username, password } as ICredential;
};

const SQL_GET_INFO = `SELECT id, pw, salt FROM userpool WHERE email=$1::VARCHAR(50);`;

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get Credential
    const { authorization } = req.headers;
    if (!authorization) throw new AppError(errDef[401].AuthorizationNotFound);

    const [scheme, cred] = authorization.split(' ');
    if (scheme != 'Basic') throw new AppError(errDef[401].InvalidAuthScheme);
    if (!cred) throw new AppError(errDef[401].UserCredentialNotFound);

    const { username, password } = decodeCredential(cred);
    const email = username; // username is user's email in this system
    if (!password) throw new AppError(errDef[401].UserCredentialNotFound);

    // Check validity
    // Email validity
    if (!isEmailValid(email)) throw new AppError(errDef[400].InvalidEmailFormatAuth);
    const validEmail = email.toLowerCase().trim();

    // Verify password
    const result = await db.query(SQL_GET_INFO, [validEmail]);
    if (!result.rowCount) throw new AppError(errDef[401].InvalidCredential); // No email found

    const { id, pw, salt } = result.rows[0] as IUserpoolRow;
    const hashed = await hash.passSalt(password, salt);
    if (hashed !== pw) throw new AppError(errDef[401].InvalidCredential); // Wrong password

    (res.locals as IBasicAuthResLocals).userId = id;
    (res.locals as IBasicAuthResLocals).email = validEmail;
    next(); // Verified
  } catch (error) {
    next(error);
  }
};

export default auth;
