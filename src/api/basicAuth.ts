import { Request, Response, NextFunction } from 'express';
import { db, hash, errDef, AppError, isEmailValid } from '../utils';

interface ICredential {
  username: string; // username is user's email
  password: string;
}

type QueryResult = {
  id: number;
  email: string;
  pw: string;
  salt: string;
};

const decodeCredential = (cred: string) => {
  const buf = Buffer.from(cred, 'base64');
  const decoded = buf.toString('ascii');
  const [username, password] = decoded.split(':');
  return { username, password } as ICredential;
};

const SQL = `SELECT * FROM api_user
WHERE email = ($1::VARCHAR(50))`;

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get Credential
    const { authorization } = req.headers;
    const cred = authorization && authorization.split(' ')[1];
    if (!cred) throw new AppError(errDef[401].UserCredentialNotFound);

    const { username, password } = decodeCredential(cred);

    // Check validity
    if (username.length > 50) throw new AppError(errDef[406].EmailTooLong);
    if (!isEmailValid(username))
      throw new AppError(errDef[400].InvalidEmailFormat);

    // Verify password
    const result = await db.query(SQL, [username]);
    if (!result.rowCount) throw new AppError(errDef[403].InvalidCredential); // No email found
    const queryRes = result.rows[0] as QueryResult;
    const recvHash = await hash.sha256(password + queryRes.salt);
    if (recvHash !== queryRes.pw)
      throw new AppError(errDef[403].InvalidCredential); // Wrong password
    res.locals.userId = queryRes.id;
    res.locals.email = username;
    next(); // Verified
  } catch (error) {
    next(error);
  }
};

export default auth;
