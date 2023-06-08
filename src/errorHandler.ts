import { NextFunction, Request, Response } from 'express';
import { logger } from './utils/logger';

export const getErrorLog = (req: Request, err: Error) => {
  let str = `[${req.method} ${req.originalUrl}] from ${req.ip} to ${req.headers.host} | ${err.message}`;
  if (err?.cause) str += ' ' + JSON.stringify(err.cause);
  return str;
};

const handler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // logging
  logger.error(getErrorLog(req, err));

  // 401 MUST include a WWW-Authenticate header field
  // @see https://tools.ietf.org/html/rfc7235#section-4.1
  if (err.status === 401) {
    const bearerAuthReqErrors = [
      'E401-AccessTokenNotFound',
      'E401-RefreshTokenNotFound',
      'E401-InvalidToken',
      'E401-TokenExpired',
    ];
    const invalidTokenErrors = ['E401-InvalidToken', 'E401-TokenExpired'];
    const scheme = bearerAuthReqErrors.includes(err.message) ? 'Bearer' : 'Basic';
    const err401 = invalidTokenErrors.includes(err.message)
      ? `, error="invalid_token", error_description="${err.message}"`
      : '';
    res.set('WWW-Authenticate', `${scheme} realm="${req.headers.host}"${err401}`);
  }

  // error presenter: this presents error to the client
  const errPresenter: any = {};
  errPresenter.status = err.status ?? 500;
  errPresenter.message = err.message;
  if (req.app.get('env') !== 'production') errPresenter.error = err; // for debugging
  res.status(errPresenter.status).json(errPresenter);

  next();
};

export default handler;
