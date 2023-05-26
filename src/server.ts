require('dotenv').config();

import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import pinoExpress from 'express-pino-logger';
import helmet from 'helmet';
import apiRouter from './api';
import { corsOption, logger, pinoExpOpt } from './utils';

const { TRUST_PROXY = '', PORT = '3000', SERVICE_NAME = 'my_api' } = process.env;
const app = express();

// Tell Express if this app is behind a proxy
// app.set('trust proxy', TRUST_PROXY);

// Middleware
app.use(express.json()); // Bodyparser
app.use(express.urlencoded({ extended: true })); // for multi-part form data
app.use(helmet()); // Security enhancer related HTTP vulnerability
app.use(cors(corsOption)); // Enable CORS
app.use(pinoExpress(pinoExpOpt)); // HTTP request logger middleware
app.use('/api', apiRouter); // Routing middleware
app.use(express.static('public')); // static files

// Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const errPresenter: any = {};
  errPresenter.status = err.status || 500;
  errPresenter.code = err.code || 'ERROR';
  errPresenter.message = err.message;
  if (req.app.get('env') === 'development') errPresenter.error = err;

  // 401 MUST include a WWW-Authenticate header field
  // @see https://tools.ietf.org/html/rfc7235#section-4.1
  if (err.status === 401) {
    const authType = err.code === 'E01' ? 'Basic' : 'Bearer';
    res.set('WWW-Authenticate', `${authType} realm="${SERVICE_NAME}"`);
  }

  // No Error Loggings for AppErrors
  if (!err.status) {
    logger.error(`[${req.method} ${req.originalUrl}] from ${req.ip} | ${JSON.stringify(err)}`);
  }

  // render the error page
  res.status(errPresenter.status).json(errPresenter);
  next();
});

app.listen(PORT, () => logger.info(`Server started on port ${PORT}`));

module.exports = app;
