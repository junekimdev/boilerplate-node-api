import { Pool, QueryResult, QueryConfig } from 'pg';

const {
  DB_POOL_MAX = '10',
  DB_IDLE_TIMEOUT = '1000',
  DB_CONN_TIMEOUT = '1000',
} = process.env;

const pool = new Pool({
  max: parseInt(DB_POOL_MAX),
  idleTimeoutMillis: parseInt(DB_IDLE_TIMEOUT),
  connectionTimeoutMillis: parseInt(DB_CONN_TIMEOUT),
});

const query = async (
  queryString: string | QueryConfig<any[]>,
  params?: any[]
) => await pool.query(queryString, params);

const transaction = async (queryFunc: () => Promise<QueryResult<any>>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await queryFunc();
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

export default { query, transaction };
