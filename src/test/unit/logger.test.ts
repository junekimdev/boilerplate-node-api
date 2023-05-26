import { logger, pinoExpOpt } from '../../utils/logger';

describe('Test /src/util/logger', () => {
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
      const req = jest.fn(() => ({ method: 'method' }));
      const res = jest.fn(() => ({ url: 'test_url' }));

      //@ts-ignore
      const str = pinoExpOpt.customReceivedMessage(req, res);

      expect(str).toEqual(expect.any(String));
    });
  });

  describe('pinoExpOpt.customSuccessMessage()', () => {
    it('should return a string', () => {
      const res = jest.fn(() => ({ statusCode: 200 }));

      //@ts-ignore
      const str = pinoExpOpt.customSuccessMessage(res);

      expect(str).toEqual(expect.any(String));
    });
  });
});
