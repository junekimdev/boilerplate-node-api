import busboy, { FieldInfo, FileInfo } from 'busboy';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { AppError, errDef } from '../utils/errors';
import hash from '../utils/hash';

const allowImageTypes = ['jpeg', 'png', 'gif', 'svg+xml'];

export const getExt = (mimeSub2: string) => {
  if (mimeSub2 === 'jpeg') return 'jpg';
  if (mimeSub2 === 'svg+xml') return 'svg';
  return mimeSub2;
};

const uploader = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals;
  const { UPLOAD_ROOT = '/data/upload' } = process.env;

  const bb = busboy({ headers: req.headers, limits: { files: 1, fileSize: 10 * 1024 * 1024 } });

  bb.on('file', (name: string, stream: Readable, info: FileInfo) => {
    const { encoding, mimeType } = info;

    // validate
    if (encoding !== 'binary') next(new AppError(errDef[400].InvalidImageType));
    const [mimeSub1, mimeSub2] = mimeType.split('/');
    if (mimeSub1 !== 'image') next(new AppError(errDef[400].InvalidImageType));
    if (!allowImageTypes.includes(mimeSub2)) next(new AppError(errDef[400].InvalidImageType));

    // create a dir
    const fileDir = path.resolve(UPLOAD_ROOT, userId);
    try {
      fs.accessSync(fileDir);
    } catch (error) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    // create a file
    const filename = path.join(fileDir, `${hash.createUUID()}.${getExt(mimeSub2)}`);
    stream.pipe(fs.createWriteStream(filename));
    res.locals.filename = filename;
  });

  bb.on('field', (name: string, value: string, info: FieldInfo) => {
    req.body[name] = value;
  });

  bb.on('filesLimit', () => next(new AppError(errDef[400].InvalidImageSize)));

  bb.on('close', next);
};

export default uploader;
