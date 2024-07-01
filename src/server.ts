import config from './utils/config';
config();

import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import apiRouter from './api';
import errorHandler from './errorHandler';
import { corsOption } from './utils/cors';
import { logger, pinoExpOpt } from './utils/logger';

const { TRUST_PROXY = '', PORT = '3000' } = process.env;
const app = express();

// Tell Express if this app is behind a proxy
// app.set('trust proxy', TRUST_PROXY);

// Middleware
app.use(express.json()); // Bodyparser
app.use(express.urlencoded({ extended: true })); // for multi-part form data
app.use(helmet()); // Security enhancer related HTTP vulnerability
app.use(cors(corsOption)); // Enable CORS
app.use(pinoHttp(pinoExpOpt)); // HTTP request logger middleware
app.use('/api', apiRouter); // Routing middleware
app.use(express.static('public')); // static files
app.use(errorHandler); // Error Handler

const server = app.listen(PORT, () => logger.info(`Server started on port ${PORT}`));

module.exports = {
  default: app,
  server,
};
