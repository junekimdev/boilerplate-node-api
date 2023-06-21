import { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { QueryResultRow } from 'pg';
import db from '../utils/db';
import { AppError, errDef } from '../utils/errors';
import hash from '../utils/hash';
import jwt from '../utils/jwt';

export interface TokenRow extends QueryResultRow {
  token: string;
}

const SQL_GET_TOKEN = `SELECT token FROM refresh_token
WHERE user_id=$1::INT AND device=$2::TEXT;`;

const SQL_DELETE_TOKEN = `DELETE FROM refresh_token
WHERE user_id=$1::INT AND device=$2::TEXT;`;

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token === undefined) throw new AppError(errDef[401].RefreshTokenNotFound);
    if (typeof refresh_token !== 'string') throw new AppError(errDef[401].InvalidToken);

    try {
      const { user_id, device, sub } = await jwt.verify(refresh_token, 'refresh');
      if (typeof user_id !== 'number') throw new AppError(errDef[401].InvalidToken);
      if (typeof device !== 'string') throw new AppError(errDef[401].InvalidToken);
      if (typeof sub !== 'string') throw new AppError(errDef[401].InvalidToken);
      const userId = user_id; // change snake_case to camelCase
      const email = sub; // sub is email of the token holder

      const hashed = hash.sha256(refresh_token);
      const resultDB = await db.query(SQL_GET_TOKEN, [userId, device]);
      if (!resultDB.rowCount)
        throw new AppError(errDef[401].InvalidToken, { cause: 'no refresh token is found in DB' });
      const tokenInDB = (resultDB.rows[0] as TokenRow).token;

      // Refresh Token Reuse Auto-detection
      if (hashed !== tokenInDB) {
        // ⚠️ refresh token reuse detected
        // invalidate refresh token by deletion
        // User is forced to login with user's credential
        await db.query(SQL_DELETE_TOKEN, [userId, device]);
        throw new AppError(errDef[401].InvalidToken, { cause: 'refresh token reuse detected' });
      }

      req.body.device = device;
      res.locals = { userId, email };
    } catch (error) {
      // Caused by expired token
      if (error instanceof TokenExpiredError) {
        throw new AppError(errDef[401].TokenExpired, { cause: error.message });
      }

      if (error instanceof JsonWebTokenError) {
        // Caused by invalid token
        throw new AppError(errDef[401].InvalidToken, { cause: error.message });
      }

      // Caused by other errors
      throw error;
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default auth;
