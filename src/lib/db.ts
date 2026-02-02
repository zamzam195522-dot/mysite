import { Pool } from 'pg';

let pool: Pool | null = null;

function shouldUseSsl(connectionString: string) {
  // Preferred: explicit env flags
  const envSsl = (process.env.DATABASE_SSL ?? '').toLowerCase();
  if (envSsl === '1' || envSsl === 'true' || envSsl === 'yes') return true;

  const envMode = (process.env.PGSSLMODE ?? '').toLowerCase();
  if (envMode && envMode !== 'disable' && envMode !== 'off' && envMode !== 'false') return true;

  // Also support query params like ?sslmode=require (common on managed Postgres URLs)
  try {
    const url = new URL(connectionString);
    const sslmode = (url.searchParams.get('sslmode') ?? '').toLowerCase();
    const ssl = (url.searchParams.get('ssl') ?? '').toLowerCase();

    if (ssl === '1' || ssl === 'true' || ssl === 'yes') return true;
    if (sslmode && sslmode !== 'disable' && sslmode !== 'off') return true;
  } catch {
    // ignore parse errors; treat as no-SSL unless explicitly requested by env vars above
  }

  return false;
}

export function getDbPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Create a .env.local based on .env.example');
  }

  const useSsl = shouldUseSsl(connectionString);
  pool = new Pool({
    connectionString,
    ...(useSsl
      ? {
          // Many providers require TLS and use certificates that don't validate via system CAs in all environments.
          // If your provider supports full verification, you can set DATABASE_SSL=true and manage CA separately.
          ssl: { rejectUnauthorized: false },
        }
      : {}),
  });
  return pool;
}

