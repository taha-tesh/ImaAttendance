import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const poolConfig = connectionString
  ? {
      connectionString,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: { rejectUnauthorized: false },
    };

if (!connectionString && (!process.env.PGHOST || !process.env.PGDATABASE || !process.env.PGUSER || !process.env.PGPASSWORD)) {
  throw new Error('Missing DATABASE_URL or one of PGHOST, PGDATABASE, PGUSER, PGPASSWORD');
}

let pool: Pool | undefined;

function getPool() {
  if (!pool) {
    pool = new Pool(poolConfig);
  }
  return pool;
}

export async function query(text: string, params: unknown[] = []) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
