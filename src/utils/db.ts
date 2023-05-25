import { Pool, PoolClient, QueryConfig, QueryResult, QueryResultRow } from 'pg';

const { DB_POOL_MAX = '10', DB_IDLE_TIMEOUT = '1000', DB_CONN_TIMEOUT = '1000' } = process.env;

const pool = new Pool({
  max: parseInt(DB_POOL_MAX),
  idleTimeoutMillis: parseInt(DB_IDLE_TIMEOUT),
  connectionTimeoutMillis: parseInt(DB_CONN_TIMEOUT),
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
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

export default { query, transaction };
