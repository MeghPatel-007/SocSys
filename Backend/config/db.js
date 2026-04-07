import pg from "pg";

const { Pool } = pg;

let pool;

const dbState = {
  engine: "postgresql",
  status: "disconnected",
  connected: false,
  host: null,
  name: null,
  error: null,
};

function getConnectionString() {
  const connectionString =
    process.env.SUPABASE_POOLER_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "SUPABASE_POOLER_URL, SUPABASE_DB_URL, POSTGRES_URL, or DATABASE_URL is not set. Add it in Backend/.env",
    );
  }

  return connectionString;
}

function getHostFromConnectionString(connectionString) {
  try {
    return new URL(connectionString).hostname || null;
  } catch {
    return null;
  }
}

function getSslConfig() {
  const sslFlag = (process.env.POSTGRES_SSL || "false").toLowerCase();
  const enabled =
    sslFlag === "true" || sslFlag === "1" || sslFlag === "require";

  return enabled ? { rejectUnauthorized: false } : undefined;
}

export async function connectDB() {
  if (pool && dbState.connected) {
    return;
  }

  const connectionString = getConnectionString();
  const host = getHostFromConnectionString(connectionString);

  dbState.status = "connecting";
  dbState.connected = false;
  dbState.host = host;
  dbState.name = null;
  dbState.error = null;

  if (pool) {
    await pool.end().catch(() => {});
    pool = undefined;
  }

  pool = new Pool({
    connectionString,
    ssl: getSslConfig(),
  });

  try {
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT current_database() AS name");

      dbState.status = "connected";
      dbState.connected = true;
      dbState.name = result.rows?.[0]?.name ?? null;
      dbState.error = null;

      console.log(`PostgreSQL connected: ${dbState.host}/${dbState.name}`);
    } finally {
      client.release();
    }
  } catch (error) {
    dbState.status = "disconnected";
    dbState.connected = false;
    dbState.name = null;
    dbState.error = error.message;
    console.error(`[DB ERROR] ${error.message}`, error);
    throw error;
  }

  pool.on("error", (error) => {
    dbState.status = "disconnected";
    dbState.connected = false;
    dbState.error = error.message;

    console.error(`PostgreSQL pool error: ${error.message}`);
  });
}

export function getDBState() {
  return { ...dbState };
}

export function getDBPool() {
  if (!pool) {
    throw new Error("PostgreSQL pool is not initialized");
  }

  return pool;
}
