import fs from 'fs';
import db from '../../utils/db';

const SQL_GET_PIC = 'SELECT profile_url FROM userpool WHERE id=$1::INT;';

const SQL_UPDATE_PIC = `UPDATE userpool SET
profile_url=NULLIF($2::TEXT, '')
WHERE id=$1::INT
RETURNING id;`;

const provider = async (userId: number, newPicURL: string) =>
  await db.transaction(async (client) => {
    // Get old picture
    const pic = await client.query(SQL_GET_PIC, [userId]);
    if (!pic.rowCount) return 0;
    const oldPicURL = (await pic).rows[0].profile_url as string;

    // Delete old picture from storage if URL is not null
    if (oldPicURL) await fs.promises.rm(oldPicURL, { force: true }); // no error for broken URL

    // update profile_url in DB
    const result = await client.query(SQL_UPDATE_PIC, [userId, newPicURL]);
    return result.rows[0].id as number;
  });

export default provider;
