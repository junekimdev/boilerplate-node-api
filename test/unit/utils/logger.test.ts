import { IncomingMessage, ServerResponse } from 'http';
import { logger, pinoExpOpt } from '../../../src/utils/logger';

describe('Test /src/util/logger', () => {
  let req: IncomingMessage;
  let res: ServerResponse;

  beforeEach(() => {
    req = { method: 'method' } as unknown as IncomingMessage;
    res = { url: 'test_url', statusCode: 200 } as unknown as ServerResponse;
    jest.clearAllMocks();
  });

  describe('logger', () => {
    it('should have methods: [error, info]', () => {
      expect(logger).toMatchObject({ error: expect.any(Function), info: expect.any(Function) });
    });
  });

  describe('pinoExpOpt', () => {
    it('should have a logger', () => {
      expect(pinoExpOpt.logger).toEqual(logger);
    });

    it('should implment methods: [customReceivedMessage, customSuccessMessage]', () => {
      expect(pinoExpOpt).toMatchObject({
        customReceivedMessage: expect.any(Function),
        customSuccessMessage: expect.any(Function),
      });
    });
  });

  describe('pinoExpOpt.customReceivedMessage()', () => {
    it('should return a string', () => {
      const str = pinoExpOpt.customReceivedMessage?.(req, res);

      expect(str).toEqual(expect.any(String));
    });
  });

  describe('pinoExpOpt.customSuccessMessage()', () => {
    it('should return a string', () => {
      const str = pinoExpOpt.customSuccessMessage?.(req, res, 10);

      expect(str).toEqual(expect.any(String));
    });
  });
});
