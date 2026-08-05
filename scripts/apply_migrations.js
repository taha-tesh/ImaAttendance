const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

async function run() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  const databaseUrl = process.env.DATABASE_URL;
  const clientConfig = databaseUrl
    ? { connectionString: databaseUrl, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.PGHOST,
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false },
      };

  if (!databaseUrl && (!process.env.PGHOST || !process.env.PGDATABASE || !process.env.PGUSER || !process.env.PGPASSWORD)) {
    console.error('Please set DATABASE_URL or PGHOST, PGDATABASE, PGUSER, PGPASSWORD environment variables');
    process.exit(2);
  }

  const client = new Client(clientConfig);
  await client.connect();

  try {
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const p = path.join(migrationsDir, file);
      console.log('Applying', file);
      const sql = fs.readFileSync(p, 'utf8');
      await client.query(sql);
    }
    console.log('Migrations applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
