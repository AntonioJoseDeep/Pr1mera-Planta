import { createClient } from '@libsql/client';

const db = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

await db.execute(`
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
await db.execute(`CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(fecha)`);

export default db;
