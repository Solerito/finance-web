import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ─── DB path & singleton ──────────────────────────────────────────────────

const DB_DIR = path.join(process.cwd(), 'database');
const DB_PATH = path.join(DB_DIR, 'finance.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure the directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  initDb(_db);
  return _db;
}

// ─── Schema initialisation ────────────────────────────────────────────────

function initDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transacciones (
      id        TEXT PRIMARY KEY,
      fecha     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      tipo      TEXT NOT NULL CHECK (tipo IN ('Ingreso', 'Gasto')),
      categoria TEXT NOT NULL,
      concepto  TEXT NOT NULL,
      importe   REAL NOT NULL CHECK (importe > 0)
    );

    CREATE INDEX IF NOT EXISTS idx_transacciones_fecha
      ON transacciones (fecha DESC);

    CREATE INDEX IF NOT EXISTS idx_transacciones_tipo_fecha
      ON transacciones (tipo, fecha);
  `);
}
