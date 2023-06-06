import { NextFunction, Request, Response } from 'express';
import { logger } from './utils/logger';

const { SERVICE_NAME = 'my_api' } = process.env;

export const getErrorLog = (req: Request, err: Error) =>
  `[${req.method} ${req.originalUrl}] from ${req.ip} to ${req.headers.host} | ${
    err.message
  } ${JSON.stringify(err)}`;

const handler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // logging
  logger.error(getErrorLog(req, err));

  // 401 MUST include a WWW-Authenticate header field
  // @see https://tools.ietf.org/html/rfc7235#section-4.1
  if (err.status === 401) {
    const bearerAuthReqErrorCodes = ['E401-4', 'E401-5', 'E401-7', 'E401-8'];
    const scheme = bearerAuthReqErrorCodes.includes(err.code) ? 'Bearer' : 'Basic';
    res.set('WWW-Authenticate', `${scheme} realm="${SERVICE_NAME}"`);
  }

  // error presenter: this presents error to the client
  const errPresenter: any = {};
  errPresenter.status = err.status ?? 500;
  errPresenter.code = err.code ?? 'ERROR';
  errPresenter.message = err.message;
  if (req.app.get('env') !== 'production') errPresenter.error = err; // for debugging
  res.status(errPresenter.status).json(errPresenter);

  next();
};

export default handler;
