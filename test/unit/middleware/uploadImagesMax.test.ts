// Mocks
jest.mock('busboy');
jest.mock('fs', () => ({
  createWriteStream: jest.fn(),
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    rm: jest.fn(),
  },
}));
jest.mock('path', () => ({ resolve: jest.fn(), join: jest.fn() }));
jest.mock('../../../src/utils/hash', () => ({ createUUID: jest.fn() }));

// Imports
import busboy, { FieldInfo, FileInfo } from 'busboy';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import uploader, { getExt } from '../../../src/middleware/uploadImagesMax';
import { AppError, errDef } from '../../../src/utils/errors';
import hash from '../../../src/utils/hash';

const mockedBusboy = busboy as unknown as jest.Mock;
const mockedFsAccess = fs.promises.access as jest.Mock;
const mockedFsCreateWriteStream = fs.createWriteStream as jest.Mock;
const mockedPathResolve = path.resolve as jest.Mock;
const mockedPathJoin = path.join as jest.Mock;
const mockedCreateUUID = hash.createUUID as jest.Mock;

describe('Test /src/middleware/uploadImageOnce', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let events: { [key: string]: any };
  let busboyInstance: { [key: string]: any };

  const userId = 123;
  const headers = { param: 'headers' };
  const fieldname = 'fieldname';
  const extType = 'png';
  const mimeType = `image/${extType}`;
  const fileInfo = { mimeType } as FileInfo;
  const fieldInfo = { nameTruncated: true, valueTruncated: true } as FieldInfo;
  const fileStream = { pipe: jest.fn(), resume: jest.fn(), on: jest.fn() } as unknown as Readable;
  const maxFile = 123;

  beforeEach(() => {
    req = { body: {}, headers, pipe: jest.fn() } as unknown as Request;
    res = { locals: { userId } } as unknown as Response;
    next = jest.fn();
    events = {};
    busboyInstance = {
      on: (event: string, callback: any) => {
        events[event] = callback;
      },
    };
    mockedBusboy.mockImplementation(() => busboyInstance);
    mockedFsCreateWriteStream.mockImplementation(() => ({
      on: (event: string, callback: any) => {
        if (event === 'finish') callback();
      },
    }));
    jest.clearAllMocks();
  });

  describe('getExt()', () => {
    const cases = [
      { target: 'jpeg', expected: 'jpg' },
      { target: 'png', expected: 'png' },
      { target: 'gif', expected: 'gif' },
      { target: 'svg+xml', expected: 'svg' },
    ];

    it.each(cases)('$target should return $expected', ({ target, expected }) =>
      expect(getExt(target)).toBe(expected),
    );
  });

  describe('uploader', () => {
    it('should create a directory if not existing', async () => {
      const projectRoot = 'projectRoot';
      const dir = 'fileDir';

      mockedPathResolve.mockReturnValue(projectRoot);
      mockedPathJoin.mockReturnValue(dir);
      mockedFsAccess.mockRejectedValue(new Error());

      await uploader()(req, res, next);

      expect(path.resolve).toBeCalled();
      expect(path.join).toBeCalled();
      expect(fs.promises.access).toBeCalledWith(dir);
      expect(fs.promises.mkdir).toBeCalledWith(dir, { recursive: true });
    });

    it('should not create a directory if existing', async () => {
      const projectRoot = 'projectRoot';
      const dir = 'fileDir';

      mockedPathResolve.mockReturnValue(projectRoot);
      mockedPathJoin.mockReturnValue(dir);
      mockedFsAccess.mockResolvedValue(true);

      await uploader()(req, res, next);

      expect(path.resolve).toBeCalled();
      expect(path.join).toBeCalled();
      expect(fs.promises.access).toBeCalledWith(dir);
      expect(fs.promises.mkdir).not.toBeCalled();
    });

    it('should init busboy', async () => {
      await uploader(maxFile)(req, res, next);

      expect(mockedBusboy.mock.calls[0][0]).toHaveProperty('headers');
      expect(mockedBusboy.mock.calls[0][0]).toHaveProperty('limits');
      expect(mockedBusboy.mock.calls[0][0].limits).toHaveProperty('files');
      expect(mockedBusboy.mock.calls[0][0].limits.files).toBe(maxFile);
      expect(req.pipe).toBeCalledWith(busboyInstance);
    });

    describe('"file" event callback', () => {
      it('should call next with InvalidImageType when mimeType is not of image', async () => {
        const expectedError = new AppError(errDef[400].InvalidImageType);
        const invalidInfo = { mimeType: 'file/png' };

        await uploader()(req, res, next);
        await events['file'](fieldname, fileStream, invalidInfo);
        await events['finish']();
        events['close']();

        expect(fileStream.resume).toBeCalled();
        expect(next).toBeCalledWith(expectedError);
      });

      it('should call next with InvalidImageType when mimeType is not one of [png, jpg, gif, svg]', async () => {
        const expectedError = new AppError(errDef[400].InvalidImageType);
        const invalidInfo = { mimeType: 'image/any' };

        await uploader()(req, res, next);
        await events['file'](fieldname, fileStream, invalidInfo);
        await events['finish']();
        events['close']();

        expect(fileStream.resume).toBeCalled();
        expect(next).toBeCalledWith(expectedError);
      });

      it('should create a file in the upload directory', async () => {
        const dir = 'fileDir';
        const uuid = 'uuid';
        const fname = 'fname';

        mockedPathJoin.mockReturnValueOnce(dir).mockReturnValueOnce(fname);
        mockedCreateUUID.mockReturnValue(uuid);

        await uploader()(req, res, next);
        await events['file'](fieldname, fileStream, fileInfo);
        await events['finish']();
        events['close']();

        expect(path.join).nthCalledWith(2, dir, `${uuid}.${extType}`);
        expect(fs.createWriteStream).toBeCalledWith(fname);
        expect(fileStream.pipe).toBeCalled();
      });
    });

    describe('"field" event callback', () => {
      it('should set key-value pairs in req.body', async () => {
        const name = 'test-name';
        const value = 'test-value';

        await uploader()(req, res, next);
        events['field'](name, value, fieldInfo);

        expect(req.body).toHaveProperty(name);
        expect(req.body[name]).toBe(value);
      });
    });

    describe('"filesLimit" event callback', () => {
      it('should call next with tooManyFilesFound when this event occurs', async () => {
        const expectedError = new AppError(errDef[400].tooManyFilesFound);

        await uploader()(req, res, next);
        events['filesLimit']();
        await events['finish']();
        events['close']();

        expect(next).toBeCalledWith(expectedError);
      });
    });

    describe('"error" event callback', () => {
      it('should call next with an error when this event occurs', async () => {
        const expectedError = new Error('err');

        await uploader()(req, res, next);
        events['error'](expectedError);
        await events['finish']();
        events['close']();

        expect(next).toBeCalledWith(expectedError);
      });
    });

    describe('"finish" event callback', () => {
      it('should remove file from storage when error occurred during uploading', async () => {
        const fname1 = 'fname1';
        const fname2 = 'fname2';

        mockedPathJoin
          .mockReturnValueOnce('dir')
          .mockReturnValueOnce(fname1)
          .mockReturnValueOnce(fname2);

        await uploader()(req, res, next);
        await events['file'](fieldname, fileStream, fileInfo);
        await events['file'](fieldname, fileStream, fileInfo);
        events['error'](new Error('err'));
        await events['finish']();

        expect(fs.promises.rm).toBeCalledTimes(2);
        expect(fs.promises.rm).nthCalledWith(1, fname1, { force: true });
        expect(fs.promises.rm).nthCalledWith(2, fname2, { force: true });
      });

      it('should set uploadedImagePaths in res.locals when no error occurs', async () => {
        const fname1 = 'fname1';
        const fname2 = 'fname2';

        mockedPathJoin
          .mockReturnValueOnce('dir')
          .mockReturnValueOnce(fname1)
          .mockReturnValueOnce(fname2);

        await uploader()(req, res, next);
        await events['file'](fieldname, fileStream, fileInfo);
        await events['file'](fieldname, fileStream, fileInfo);
        await events['finish']();

        expect(res.locals).toHaveProperty('uploadedImagePaths');
        expect(res.locals.uploadedImagePaths).toHaveLength(2);
      });
    });

    describe('"close" event callback', () => {
      it('should call next with an error when error occurred during uploading', async () => {
        const expectedError = new Error('err');

        await uploader()(req, res, next);
        events['error'](expectedError);
        await events['finish']();
        events['close']();

        expect(next).toBeCalledWith(expectedError);
      });

      it('should call next when no error occurs', async () => {
        await uploader()(req, res, next);
        events['close']();

        expect(next).toBeCalledWith();
      });
    });
  });
});
