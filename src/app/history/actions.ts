'use server';

import { getDb } from '@/lib/db';
import { type Transaction } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HistoryFilters {
  query?: string;          // full-text search on concepto + categoria
  tipo?: 'Ingreso' | 'Gasto' | 'all';
  categoria?: string;      // 'all' or specific category
  importeMin?: number;
  importeMax?: number;
  from?: string;           // YYYY-MM-DD
  to?: string;             // YYYY-MM-DD
}

export interface HistoryPage {
  rows: Transaction[];
  total: number;           // total matching rows (for pagination)
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWhere(f: HistoryFilters): { sql: string; params: (string | number)[] } {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (f.from) {
    clauses.push(`fecha >= ?`);
    params.push(`${f.from}T00:00:00Z`);
  }
  if (f.to) {
    clauses.push(`fecha <= ?`);
    params.push(`${f.to}T23:59:59Z`);
  }
  if (f.tipo && f.tipo !== 'all') {
    clauses.push(`tipo = ?`);
    params.push(f.tipo);
  }
  if (f.categoria && f.categoria !== 'all') {
    clauses.push(`categoria = ?`);
    params.push(f.categoria);
  }
  if (f.importeMin !== undefined && !isNaN(f.importeMin)) {
    clauses.push(`importe >= ?`);
    params.push(f.importeMin);
  }
  if (f.importeMax !== undefined && !isNaN(f.importeMax)) {
    clauses.push(`importe <= ?`);
    params.push(f.importeMax);
  }
  if (f.query?.trim()) {
    clauses.push(`(concepto LIKE ? OR categoria LIKE ?)`);
    const like = `%${f.query.trim()}%`;
    params.push(like, like);
  }

  const sql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  return { sql, params };
}

// ─── Search with pagination ───────────────────────────────────────────────────

export async function searchTransactions(
  filters: HistoryFilters = {},
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<HistoryPage> {
  const db = getDb();
  const { sql: where, params } = buildWhere(filters);

  const countRow = db
    .prepare(`SELECT COUNT(*) AS total FROM transacciones ${where}`)
    .get(...params) as { total: number };

  const total = countRow.total;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const offset = safePage * pageSize;

  const rows = db
    .prepare(
      `SELECT id, fecha, tipo, categoria, concepto, importe
       FROM transacciones ${where}
       ORDER BY fecha DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, offset) as Transaction[];

  return { rows, total, page: safePage, pageSize, totalPages };
}

// ─── Get all categories present in the DB ─────────────────────────────────────

export async function getHistoryCategories(): Promise<string[]> {
  const db = getDb();
  const rows = db
    .prepare(`SELECT DISTINCT categoria FROM transacciones ORDER BY categoria`)
    .all() as { categoria: string }[];
  return rows.map((r) => r.categoria);
}

// ─── Export as CSV (returns raw string, client downloads it) ──────────────────

export async function exportTransactionsCsv(filters: HistoryFilters = {}): Promise<string> {
  const db = getDb();
  const { sql: where, params } = buildWhere(filters);

  const rows = db
    .prepare(
      `SELECT id, fecha, tipo, categoria, concepto, importe
       FROM transacciones ${where}
       ORDER BY fecha DESC`,
    )
    .all(...params) as Transaction[];

  const header = 'ID,Fecha,Tipo,Categoría,Concepto,Importe\n';
  const lines = rows.map((r) => {
    const fecha = r.fecha.slice(0, 10);
    const importe = r.tipo === 'Gasto' ? `-${r.importe}` : `${r.importe}`;
    return [r.id, fecha, r.tipo, r.categoria, `"${r.concepto.replace(/"/g, '""')}"`, importe].join(',');
  });

  return header + lines.join('\n');
}
