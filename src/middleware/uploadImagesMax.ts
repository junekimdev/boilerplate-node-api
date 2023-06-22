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

const uploader =
  (maxFile = Infinity) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = res.locals;
    const { UPLOAD_ROOT = '/data/upload' } = process.env;

    const projectRoot = path.resolve(__dirname, '../../');
    const fileDir = path.join(projectRoot, UPLOAD_ROOT, `${userId}`);
    const names: string[] = [];
    let resultError: any = null;

    // create a dir
    try {
      await fs.promises.access(fileDir);
    } catch (error) {
      await fs.promises.mkdir(fileDir, { recursive: true });
    }

    const bb = busboy({ headers: req.headers, limits: { files: maxFile } });

    bb.on('file', async (fieldname: string, file: Readable, info: FileInfo) => {
      const { mimeType } = info;

      const uploading = new Promise<void>((resolve, reject) => {
        file.on('error', reject);

        // validate
        const [mimeSub1, mimeSub2] = mimeType.split('/');
        if (mimeSub1 !== 'image' || !allowImageTypes.includes(mimeSub2)) {
          file.resume();
          reject(new AppError(errDef[400].InvalidImageType));
          return;
        }

        // create a file
        const uuid = hash.createUUID();
        const filename = path.join(fileDir, `${uuid}.${getExt(mimeSub2)}`);
        names.push(filename);

        const writer = fs.createWriteStream(filename);
        writer.on('error', reject);
        writer.on('finish', resolve);
        file.pipe(writer);
      });

      try {
        await uploading;
      } catch (error) {
        resultError = error;
      }
    });

    bb.on('field', (fieldname: string, value: string, info: FieldInfo) => {
      req.body[fieldname] = value;
    });

    bb.on('filesLimit', () => {
      resultError = new AppError(errDef[400].tooManyFilesFound);
    });

    bb.on('error', (err) => {
      resultError = err;
    });

    bb.on('finish', async () => {
      if (resultError) {
        names.forEach(async (name: string) => {
          await fs.promises.rm(name, { force: true });
        });
      } else {
        res.locals.uploadedImagePaths = names;
      }
    });

    bb.on('close', () => {
      resultError ? next(resultError) : next();
    });

    req.pipe(bb);
  };

export default uploader;
