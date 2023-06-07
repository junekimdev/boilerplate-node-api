import { NextFunction, Request, Response } from 'express';
import db from '../../utils/db';
import { AppError, errDef } from '../../utils/errors';
import { isValidTopic } from '../../utils/webpush';
import provider from './provider';
import { IReqBody } from './types';

const SQL_CHECK_TOPIC = `SELECT id FROM topic WHERE name=$1::VARCHAR(50);`;

const handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, payload } = req.body as IReqBody;
    if (!isValidTopic(topic)) throw new AppError(errDef[400].InvalidPushTopic);
    if (!payload) throw new AppError(errDef[400].InvalidPayload);

    const result = await db.query(SQL_CHECK_TOPIC, [topic]);
    if (!result.rowCount) throw new AppError(errDef[400].InvalidPushTopic); // Topic doesn't exist

    await provider(topic, payload);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export default handler;
