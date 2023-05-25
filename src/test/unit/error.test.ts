import { AppError, IError, errDef, errDefType } from '../../utils/errors';

describe('Test /src/utils/errors', () => {
  describe('Class "AppError" when constructed without an arg', () => {
    const err = new AppError();

    it('should have props: [status, code, error_in, message]', () => {
      expect(err).toHaveProperty('status');
      expect(err).toHaveProperty('code');
      expect(err).toHaveProperty('error_in');
      expect(err).toHaveProperty('message');
    });

    it('should be an instance of Error', () => {
      expect(err).toBeInstanceOf(Error);
    });

    it('should have error status 500', () => {
      expect(err.status).toBe(500);
    });
  });

  describe('Class "AppError" when constructed with an arg', () => {
    const mockErrDef = {
      status: 1,
      code: 'aaa',
      error_in: 'body',
      message: 'msg',
    };

    const err = new AppError(mockErrDef);

    it('should have same info to the object in arg', () => {
      expect(err.status).toBe(mockErrDef.status);
      expect(err.code).toBe(mockErrDef.code);
      expect(err.error_in).toBe(mockErrDef.error_in);
      expect(err.message).toBe(mockErrDef.message);
    });
  });

  describe('Object "errDef"', () => {
    const numReg = /[0-9]{3}/;
    it.each(Object.keys(errDef))('%s should be 3 digit numeric string', (key) => {
      expect(key).toMatch(numReg);
    });

    const expected = expect.objectContaining({
      status: expect.any(Number),
      code: expect.any(String),
      error_in: expect.any(String),
      message: expect.any(String),
    });

    describe.each(Object.keys(errDef))(
      '%s should be objects in the type of { [errorName: string]: IError }',
      (codeName: string) => {
        it.each(Object.keys(errDef[codeName]))(
          '%s should have an object in the type of IError',
          (errorName) => {
            const obj: IError = errDef[codeName][errorName];
            expect(obj).toEqual(expected);
          },
        );
      },
    );
  });
});
