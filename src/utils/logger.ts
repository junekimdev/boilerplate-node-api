import pino from 'pino';
import { Options } from 'pino-http';

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
  customSuccessMessage: (req, res, resTime) =>
    `Responded with status [${res.statusCode}] in ${resTime}s`,
};
