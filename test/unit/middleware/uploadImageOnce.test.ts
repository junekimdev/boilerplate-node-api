// Mocks
jest.mock('busboy');
jest.mock('fs', () => ({
  accessSync: jest.fn(),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn(),
}));
jest.mock('path', () => ({ resolve: jest.fn(), join: jest.fn() }));
jest.mock('../../../src/utils/hash', () => ({ createUUID: jest.fn() }));

// Imports
import busboy, { FieldInfo, FileInfo } from 'busboy';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import uploader, { getExt } from '../../../src/middleware/uploadImageOnce';
import { AppError, errDef } from '../../../src/utils/errors';
import hash from '../../../src/utils/hash';

const mockedBusboy = busboy as unknown as jest.Mock;
const mockedFsAccessSync = fs.accessSync as jest.Mock;
const mockedFsCreateWriteStream = fs.createWriteStream as jest.Mock;
const mockedPathResolve = path.resolve as jest.Mock;
const mockedPathJoin = path.join as jest.Mock;
const mockedCreateUUID = hash.createUUID as jest.Mock;

describe('Test /src/middleware/uploadImageOnce', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let stream: Readable;
  let events: { [key: string]: any };

  const userId = 123;
  const headers = { param: 'headers' };
  const filename = 'filename';
  const extType = 'png';
  const mimeType = `image/${extType}`;
  const fileInfo = { mimeType } as FileInfo;
  const fieldInfo = { nameTruncated: true, valueTruncated: true } as FieldInfo;

  beforeEach(() => {
    req = { body: {}, headers } as unknown as Request;
    res = { locals: { userId } } as unknown as Response;
    next = jest.fn();
    stream = { pipe: jest.fn() } as unknown as Readable;
    events = new Map();
    mockedBusboy.mockImplementation(() => ({
      on: (event: string, callback: any) => {
        events[event] = callback;
      },
    }));
    jest.clearAllMocks();
  });

  describe('getExt()', () => {
    it('should return "jpg" when "jpeg" is the arg', () => {
      expect(getExt('jpeg')).toBe('jpg');
    });
    it('should return "svg" when "svg+xml" is the arg', () => {
      expect(getExt('svg+xml')).toBe('svg');
    });
    it('should return "jpg" when "jpeg" is the arg', () => {
      expect(getExt('png')).toBe('png');
    });
    it('should return "gif" when "gif" is the arg', () => {
      expect(getExt('gif')).toBe('gif');
    });
  });

  describe('uploader', () => {
    it('should init busboy', async () => {
      await uploader(req, res, next);

      expect(mockedBusboy.mock.calls[0][0]).toHaveProperty('headers');
      expect(mockedBusboy.mock.calls[0][0]).toHaveProperty('limits');
    });

    describe('"file" event callback', () => {
      it('should call next with InvalidImageType when mimeType is not of image', async () => {
        const expectedError = new AppError(errDef[400].InvalidImageType);
        const invalidInfo = { mimeType: 'file/png' };

        await uploader(req, res, next);
        events['file'](filename, stream, invalidInfo);

        expect(next).toBeCalledWith(expectedError);
      });

      it('should call next with InvalidImageType when mimeType is not one of [png, jpg, gif, svg]', async () => {
        const expectedError = new AppError(errDef[400].InvalidImageType);
        const invalidInfo = { mimeType: 'image/any' };

        await uploader(req, res, next);
        events['file'](filename, stream, invalidInfo);

        expect(next).toBeCalledWith(expectedError);
      });

      it('should create a directory if not existing', async () => {
        const projectRoot = 'projectRoot';
        const dir = 'fileDir';

        mockedPathResolve.mockReturnValue(projectRoot);
        mockedPathJoin.mockReturnValue(dir);
        mockedFsAccessSync.mockImplementationOnce(() => {
          throw new Error();
        });

        await uploader(req, res, next);
        events['file'](filename, stream, fileInfo);

        expect(path.resolve).toBeCalled();
        expect(path.join).toBeCalled();
        expect(fs.accessSync).toBeCalledWith(dir);
        expect(fs.mkdirSync).toBeCalledWith(dir, { recursive: true });
      });

      it('should create a file in the upload directory', async () => {
        const projectRoot = 'projectRoot';
        const dir = 'fileDir';
        const uuid = 'uuid';
        const fname = 'fname';
        const writer = 'writer';

        mockedPathResolve.mockReturnValue(projectRoot);
        mockedPathJoin.mockReturnValueOnce(dir).mockReturnValueOnce(fname);
        mockedCreateUUID.mockReturnValue(uuid);
        mockedFsCreateWriteStream.mockReturnValue(writer);

        await uploader(req, res, next);
        events['file'](filename, stream, fileInfo);

        expect(path.join).nthCalledWith(2, dir, `${uuid}.${extType}`);
        expect(fs.createWriteStream).toBeCalledWith(fname);
        expect(stream.pipe).toBeCalledWith(writer);
        expect(res.locals).toHaveProperty('filename');
        expect(res.locals.filename).toBe(fname);
      });
    });

    describe('"field" event callback', () => {
      it('should set key-value pairs in req.body', async () => {
        const name = 'test-name';
        const value = 'test-value';

        await uploader(req, res, next);
        events['field'](name, value, fieldInfo);

        expect(req.body).toHaveProperty(name);
        expect(req.body[name]).toBe(value);
      });
    });

    describe('"filesLimit" event callback', () => {
      it('should call next with InvalidImageSize when this event occurs', async () => {
        const expectedError = new AppError(errDef[400].InvalidImageSize);

        await uploader(req, res, next);
        events['filesLimit']();

        expect(next).toBeCalledWith(expectedError);
      });
    });

    describe('"close" event callback', () => {
      it('should call next when this event occurs', async () => {
        await uploader(req, res, next);
        events['close']();

        expect(next).toBeCalledWith();
      });
    });
  });
});
