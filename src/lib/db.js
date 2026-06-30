import { createClient } from '@libsql/client';

let db;
let initialized = false;

function getClient() {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL || import.meta.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN || import.meta.env.TURSO_AUTH_TOKEN,
    });
  }
  return db;
}

async function ensureSchema(client) {
  if (initialized) return;
  await client.execute(`
    CREATE TABLE IF NOT EXISTS reservas (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL,
      email TEXT,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      personas TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'confirmada',
      creada TEXT NOT NULL
    )
  `);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(fecha)`);
  initialized = true;
}

export async function execute(query) {
  const client = getClient();
  await ensureSchema(client);
  return client.execute(query);
}
