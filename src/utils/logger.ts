import pino from 'pino';
import { Options } from 'express-pino-logger';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'SYS:standard',
      // levelFirst: true,
      colorize: true,
      hideObject: true,
    },
  },
});

export const pinoExpOpt: Options = {
  logger,
  customReceivedMessage: (req, res) => `${req.method} ${req.url}`,
  customSuccessMessage: (res) => `Responded with status [${res.statusCode}]`,
};
