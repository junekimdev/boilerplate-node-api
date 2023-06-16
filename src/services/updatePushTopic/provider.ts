import db from '../../utils/db';
import { AppError, errDef, UK_ERR_CODE } from '../../utils/errors';

const SQL_UPDATE_TOPIC = `UPDATE topic SET name=$2::VARCHAR(50)
WHERE name=$1::VARCHAR(50) RETURNING id;`;

const provider = async (oldName: string, newName: string) =>
  await db.transaction(async (client) => {
    try {
      const result = await client.query(SQL_UPDATE_TOPIC, [oldName, newName]);
      if (!result.rowCount) throw new AppError(errDef[404].TopicNotFound);
      return result.rows[0].id as number;
    } catch (error: any) {
      if (error.code === UK_ERR_CODE) throw new AppError(errDef[409].PushTopicAlreadyExists);
      throw error;
    }
  });

export default provider;
