import { AppError, IError, errDef } from '../../../src/utils/errors';

type errDefType = {
  [status: string]: { [errorName: string]: IError };
};

describe('Test /src/utils/errors', () => {
  describe('Class "AppError" when constructed without an arg', () => {
    const err = new AppError();

    it('should have props: [status, code, error_in, message]', () => {
      expect(err).toHaveProperty('status');
      expect(err).toHaveProperty('message');
      expect(err).toHaveProperty('error_in');
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
      message: 'msg',
      error_in: 'body',
    };

    const err = new AppError(mockErrDef);

    it('should have same info to the object in arg', () => {
      expect(err.status).toBe(mockErrDef.status);
      expect(err.message).toBe(mockErrDef.message);
      expect(err.error_in).toBe(mockErrDef.error_in);
    });
  });

  describe('Object "errDef"', () => {
    it.each(Object.keys(errDef))('%s should be 3 digit numeric string', (key) => {
      expect(key).toMatch(/[0-9]{3}/);
    });

    const expected = expect.objectContaining({
      status: expect.any(Number),
      message: expect.any(String),
      error_in: expect.any(String),
    });

    describe.each(Object.keys(errDef))(
      '%s should be objects in the type of { [errorName: string]: IError }',
      (codeName: string) => {
        const errorGroups = (errDef as errDefType)[codeName];
        it.each(Object.keys(errorGroups))(
          '%s should have an object in the type of IError',
          (errorName) => {
            const obj: IError = errorGroups[errorName];
            expect(obj).toEqual(expected);
          },
        );
      },
    );
  });
});
