import pino from 'pino';
import { logger, pinoExpOpt } from '../../utils/logger';

describe('Test /src/util/logger', () => {
  describe('logger', () => {
    it('should have methods: [error, info]', () => {
      expect(logger).toMatchObject({ error: expect.any(Function), info: expect.any(Function) });
    });
  });

  describe('pinoExpOpt', () => {
    it('should have methods: [customReceivedMessage, customSuccessMessage]', () => {
      expect(pinoExpOpt).toMatchObject({
        customReceivedMessage: expect.any(Function),
        customSuccessMessage: expect.any(Function),
      });
    });
  });
});
