const { Pool } = require('pg');

let pool = null;
let initPromise = null;
let initialized = false;

function parseIntEnv(name, fallback) {
  const parsed = parseInt(process.env[name] || '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseMillisEnv(name, fallback) {
  const parsed = parseIntEnv(name, fallback);
  return parsed > 0 && parsed < 1000 ? parsed * 1000 : parsed;
}

function getSslConfig() {
  const explicit = (process.env.DB_SSL || '').toLowerCase();
  if (['true', '1', 'require'].includes(explicit)) {
    return { rejectUnauthorized: false };
  }
  if (['false', '0', 'disable'].includes(explicit)) {
    return false;
  }

  try {
    const parsedUrl = new URL(process.env.DATABASE_URL || '');
    const sslMode = parsedUrl.searchParams.get('sslmode');
    if (sslMode === 'require') return { rejectUnauthorized: false };
    if (sslMode === 'disable') return false;

    if (/railway|rlwy/i.test(parsedUrl.hostname)) {
      return { rejectUnauthorized: false };
    }
  } catch (_err) {
    // Ignore invalid URLs here; pg will surface a clear connection error later.
  }

  if (process.env.NODE_ENV === 'production') {
    return { rejectUnauthorized: false };
  }

  return undefined;
}

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!isDatabaseConfigured()) return null;

  if (!pool) {
    const ssl = getSslConfig();
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: parseIntEnv('DB_POOL_MAX', 10),
      idleTimeoutMillis: parseMillisEnv('DB_POOL_IDLE_TIMEOUT', 30000),
      connectionTimeoutMillis: parseMillisEnv('DB_CONNECT_TIMEOUT', 10000),
      ...(ssl === undefined ? {} : { ssl }),
    });
  }

  return pool;
}

async function query(text, params = []) {
  const db = getPool();
  if (!db) return null;
  return db.query(text, params);
}

async function initDatabase() {
  if (!isDatabaseConfigured()) return false;
  if (initialized) return true;

  if (!initPromise) {
    initPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS comparison_templates (
          id uuid PRIMARY KEY,
          template_name text NOT NULL,
          description text NOT NULL DEFAULT '',
          mapping_json jsonb NOT NULL DEFAULT '{}'::jsonb,
          rules_json jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS comparison_jobs (
          id uuid PRIMARY KEY,
          upload_id uuid,
          status text NOT NULL,
          progress integer NOT NULL DEFAULT 0,
          progress_message text,
          result_json jsonb,
          error text,
          file_a_name text,
          file_b_name text,
          created_at timestamptz NOT NULL DEFAULT now(),
          completed_at timestamptz
        );
      `);
      initialized = true;
      return true;
    })().catch((err) => {
      initPromise = null;
      console.error('[DB] PostgreSQL init failed:', err.message);
      return false;
    });
  }

  return initPromise;
}

module.exports = {
  getPool,
  initDatabase,
  isDatabaseConfigured,
  query,
};
