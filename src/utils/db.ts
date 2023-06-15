import { Pool, PoolClient, QueryConfig, QueryResult, QueryResultRow } from 'pg';
import { logger } from './logger';

const { DB_POOL_MAX = '10', DB_IDLE_TIMEOUT = '1000', DB_CONN_TIMEOUT = '1000' } = process.env;

export const FK_ERR_CODE = '23503';
export const UK_ERR_CODE = '23505';

export const pool = new Pool({
  max: parseInt(DB_POOL_MAX),
  idleTimeoutMillis: parseInt(DB_IDLE_TIMEOUT),
  connectionTimeoutMillis: parseInt(DB_CONN_TIMEOUT),
});

pool.on('connect', (client) => {
  logger.info(`[DB Info] total connection count: ${pool.totalCount}`);
});

pool.on('error', (err, client) => {
  logger.error(`[DB Error] ${err.message}`);
});

export const query = async (queryString: string | QueryConfig<any[]>, params?: any[]) =>
  await pool.query<QueryResultRow>(queryString, params);

export const transaction = async <T = QueryResult<QueryResultRow>>(
  queryFunc: (client: PoolClient) => Promise<T>,
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await queryFunc(client);
    await client.query('COMMIT');
    client.release();
    return result;
  } catch (err) {
    // If client is in error state, pg.Pool is resposible for removing it.
    // So, we don't need to worry about the client here
    await client.query('ROLLBACK');
    client.release(err as Error);
    logger.warn(`[DB ROLLBACK] ${(err as Error).message}`);
    throw err;
  }
};

export default { query, transaction };
