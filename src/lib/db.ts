import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ─── DB path & singleton ──────────────────────────────────────────────────────
//
// Priority:
//  1. DATABASE_PATH env var (set this on the server to point to finanzas.db)
//     e.g. DATABASE_PATH=/home/user/docker/gestor-finanzas/app/data/finanzas.db
//  2. ./database/finance.db  (local development default)
//

function resolveDbPath(): string {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  const DB_DIR = path.join(process.cwd(), 'database');
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  return path.join(DB_DIR, 'finance.db');
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = resolveDbPath();

  // Ensure parent directory exists (useful when DATABASE_PATH points somewhere new)
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  _db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  initDb(_db);
  return _db;
}

// ─── Schema initialisation ────────────────────────────────────────────────────

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

    CREATE TABLE IF NOT EXISTS categorias_personalizadas (
      nombre TEXT PRIMARY KEY
    );

    -- ── Presupuestos ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS presupuestos (
      id              TEXT PRIMARY KEY,
      categoria       TEXT NOT NULL UNIQUE,
      limite_mensual  REAL NOT NULL CHECK (limite_mensual > 0),
      activo          INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
    );

    -- ── Metas de ahorro ───────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS metas (
      id             TEXT PRIMARY KEY,
      nombre         TEXT NOT NULL,
      objetivo       REAL NOT NULL CHECK (objetivo > 0),
      aportado       REAL NOT NULL DEFAULT 0 CHECK (aportado >= 0),
      fecha_objetivo TEXT,          -- ISO date "YYYY-MM-DD", nullable
      icono          TEXT NOT NULL DEFAULT '🎯',
      color          TEXT NOT NULL DEFAULT '#9b8ec4'
    );
  `);
}


