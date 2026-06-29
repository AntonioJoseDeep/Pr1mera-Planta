import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, '..', '..', 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'reservas.db'));
db.pragma('journal_mode = WAL');

db.exec(`
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
  );
  CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(fecha);
`);

export default db;
