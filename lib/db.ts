import { Pool } from 'pg';

// Optional CA cert for validating the Postgres server's TLS certificate,
// mirroring the pattern used for Elasticsearch in
// lib/config/certificate.config.ts (env var takes precedence, base64-encoded).
function getPostgresCaCert(): Buffer | undefined {
  if (process.env.POSTGRES_CA_CERT) {
    return Buffer.from(process.env.POSTGRES_CA_CERT, 'base64');
  }
  return undefined;
}

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE,
  // Certificate validation is intentionally left on (rejectUnauthorized is
  // not set to false): an unvalidated TLS connection is vulnerable to MITM.
  // If the Postgres server uses a private CA, set POSTGRES_CA_CERT
  // (base64-encoded) so the connection can be validated correctly.
  ssl: process.env.POSTGRES_USE_SSL === 'true' ? {
    ca: getPostgresCaCert(),
  } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('PostgreSQL connection established');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
  process.exit(-1);
});

export async function query(text: string, params: any[] = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    //console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

export async function getClient() {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  
  // Override client.query to log queries
  // @ts-ignore
  client.query = (...args) => {
    const start = Date.now();
    // @ts-ignore
    return query.apply(client, args).then((res) => {
      const duration = Date.now() - start;
      //console.log('Executed query', { text: args[0], duration, rows: res.rowCount });
      return res;
    });
  };
  
  client.release = () => {
    console.log('Client released');
    return release.apply(client);
  };
  
  return client;
}

export default {
  query,
  getClient,
  pool
};