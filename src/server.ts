require('dotenv').config();

import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import pinoExpress from 'express-pino-logger';
import helmet from 'helmet';
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
app.use(pinoExpress(pinoExpOpt)); // HTTP request logger middleware
app.use('/api', apiRouter); // Routing middleware
app.use(express.static('public')); // static files
app.use(errorHandler); // Error Handler

app.listen(PORT, () => logger.info(`Server started on port ${PORT}`));

export default app;
