import { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { AppError, errDef } from '../utils/errors';
import jwt from '../utils/jwt';

export interface IBearerAuthResLocals {
  accessRegex?: RegExp;
  decodedToken?: JwtPayload;
}

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token
    const { authorization } = req.headers;
    if (!authorization) throw new AppError(errDef[401].AuthorizationNotFound);

    const [scheme, accessToken] = authorization.split(' ');
    if (scheme !== 'Bearer') throw new AppError(errDef[401].InvalidAuthScheme);
    if (!accessToken) throw new AppError(errDef[401].AccessTokenNotFound);

    // Get regex from access control
    const { accessRegex } = res.locals as IBearerAuthResLocals;
    if (!accessRegex) throw new AppError(errDef[403].AccessUndefined);

    // Verify token
    try {
      (res.locals as IBearerAuthResLocals).decodedToken = jwt.verify(accessToken, accessRegex);
    } catch (error) {
      // Caused by expired token
      if (error instanceof TokenExpiredError) {
        throw new AppError(errDef[401].TokenExpired, { cause: error.message });
      }

      if (error instanceof JsonWebTokenError) {
        // Caused by denied access
        if (error.message.startsWith('jwt audience invalid')) {
          throw new AppError(errDef[403].AccessDenied, { cause: error.message });
        }

        // Caused by invalid token
        throw new AppError(errDef[401].InvalidToken, { cause: error.message });
      }

      // Caused by unknown error
      throw error;
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default auth;
