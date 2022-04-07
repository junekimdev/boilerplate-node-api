import { Request, Response, NextFunction } from 'express';
import { jwt, errDef, AppError, JwtPayload, VerifyErrors } from '../utils';

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token
    const { authorization } = req.headers;
    const accessToken = authorization && authorization.split(' ')[1];
    if (!accessToken) throw new AppError(errDef[401].AccessTokenNotFound);

    // Verify token
    let decodedToken: JwtPayload;
    try {
      decodedToken = jwt.verify(accessToken);
    } catch (error) {
      throw new AppError(errDef[401].InvalidToken, {
        cause: error as VerifyErrors,
      });
    }
    res.locals.accessToken = decodedToken; // Pass decoded token via res.locals
    next();
  } catch (error) {
    next(error);
  }
};

export default auth;
