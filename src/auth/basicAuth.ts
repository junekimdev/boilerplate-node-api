import { NextFunction, Request, Response } from 'express';
import db from '../utils/db';
import { isEmailValid } from '../utils/email';
import { AppError, errDef } from '../utils/errors';
import hash from '../utils/hash';

interface ICredential {
  username: string; // username is user's email
  password: string | undefined;
}

type QueryResult = {
  id: number;
  pw: string;
  salt: string;
};

export const decodeCredential = (cred: string) => {
  const buf = Buffer.from(cred, 'base64');
  const decoded = buf.toString('utf8');
  const [username, password] = decoded.split(':');
  return { username, password } as ICredential;
};

const SQL_GET_INFO = `SELECT id, pw, salt FROM userpool WHERE email=$1::VARCHAR(50)`;
const SQL_UPDATE_LOGIN_TIME = `UPDATE userpool SET last_login=NOW() email=$1::VARCHAR(50)`;

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
    if (!isEmailValid(email)) throw new AppError(errDef[400].InvalidEmailFormat);

    // Verify password
    const result = await db.query(SQL_GET_INFO, [email]);
    if (!result.rowCount) throw new AppError(errDef[401].InvalidCredential); // No email found

    const queryRes = result.rows[0] as QueryResult;
    const recvHash = await hash.sha256(password + queryRes.salt);
    if (recvHash !== queryRes.pw) throw new AppError(errDef[401].InvalidCredential); // Wrong password

    res.locals.userId = queryRes.id;
    res.locals.email = email;
    await db.query(SQL_UPDATE_LOGIN_TIME, [email]); // consider the user logged in
    next(); // Verified
  } catch (error) {
    next(error);
  }
};

export default auth;
