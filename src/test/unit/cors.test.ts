import { corsOption } from '../../utils/cors';

describe('Test /src/util/cors', () => {
  describe('corsOption', () => {
    it('should have props: [origin, optionsSuccessStatus]', () => {
      expect(corsOption).toHaveProperty('origin');
      expect(corsOption).toHaveProperty('optionsSuccessStatus', 200);
    });
  });
});
