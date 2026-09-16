'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import {
  type Transaction,
  type CreateTransactionInput,
  type ActionResult,
  type KpiData,
  type MonthlyProfit,
  type CategoryExpense,
  MESES_CORTOS,
} from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

// ─── Create ───────────────────────────────────────────────────────────────

export async function createTransaction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tipo = formData.get('tipo') as string;
    const categoria = formData.get('categoria') as string;
    const concepto = formData.get('concepto') as string;
    const importeStr = formData.get('importe') as string;
    const fechaStr = formData.get('fecha') as string;

    // Basic validation
    if (!tipo || !['Ingreso', 'Gasto'].includes(tipo)) {
      return { success: false, error: 'Tipo inválido' };
    }
    if (!categoria?.trim()) {
      return { success: false, error: 'La categoría es obligatoria' };
    }
    if (!concepto?.trim()) {
      return { success: false, error: 'El concepto es obligatorio' };
    }
    const importe = parseFloat(importeStr);
    if (isNaN(importe) || importe <= 0) {
      return { success: false, error: 'El importe debe ser un número positivo' };
    }

    const fecha = fechaStr
      ? new Date(fechaStr).toISOString()
      : new Date().toISOString();

    const input: CreateTransactionInput = {
      tipo: tipo as 'Ingreso' | 'Gasto',
      categoria: categoria.trim(),
      concepto: concepto.trim(),
      importe,
      fecha,
    };

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO transacciones (id, fecha, tipo, categoria, concepto, importe)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(generateId(), input.fecha, input.tipo, input.categoria, input.concepto, input.importe);

    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('[createTransaction]', err);
    return { success: false, error: 'Error al guardar la transacción' };
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    if (!id?.trim()) return { success: false, error: 'ID inválido' };
    const db = getDb();
    db.prepare('DELETE FROM transacciones WHERE id = ?').run(id);
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('[deleteTransaction]', err);
    return { success: false, error: 'Error al eliminar la transacción' };
  }
}

// ─── Read: latest transactions ────────────────────────────────────────────

export async function getTransactions(limit = 50): Promise<Transaction[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, fecha, tipo, categoria, concepto, importe
       FROM transacciones
       ORDER BY fecha DESC
       LIMIT ?`,
    )
    .all(limit) as Transaction[];
  return rows;
}

// ─── Read: KPIs for given month ───────────────────────────────────────────

export async function getKpis(year: number, month: number): Promise<KpiData> {
  const db = getDb();

  // SQLite date prefix: YYYY-MM
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo = 'Ingreso' THEN importe ELSE 0 END), 0) AS totalIngresos,
         COALESCE(SUM(CASE WHEN tipo = 'Gasto'   THEN importe ELSE 0 END), 0) AS totalGastos
       FROM transacciones
       WHERE fecha LIKE ?`,
    )
    .get(`${prefix}%`) as { totalIngresos: number; totalGastos: number };

  return {
    totalIngresos: row.totalIngresos,
    totalGastos: row.totalGastos,
    beneficioNeto: row.totalIngresos - row.totalGastos,
  };
}

// ─── Read: monthly profits for given year ─────────────────────────────────

export async function getMonthlyProfits(year: number): Promise<MonthlyProfit[]> {
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT
         CAST(strftime('%m', fecha) AS INTEGER) AS mesNum,
         COALESCE(SUM(CASE WHEN tipo = 'Ingreso' THEN importe ELSE 0 END), 0) AS ingresos,
         COALESCE(SUM(CASE WHEN tipo = 'Gasto'   THEN importe ELSE 0 END), 0) AS gastos
       FROM transacciones
       WHERE fecha LIKE ?
       GROUP BY mesNum
       ORDER BY mesNum`,
    )
    .all(`${year}%`) as Array<{ mesNum: number; ingresos: number; gastos: number }>;

  // Fill all 12 months (so chart always has full year)
  const byMonth = new Map(rows.map((r) => [r.mesNum, r]));

  return Array.from({ length: 12 }, (_, i) => {
    const mesNum = i + 1;
    const row = byMonth.get(mesNum);
    const ingresos = row?.ingresos ?? 0;
    const gastos = row?.gastos ?? 0;
    return {
      mes: MESES_CORTOS[i],
      ingresos,
      gastos,
      beneficio: ingresos - gastos,
    };
  });
}

// ─── Read: expenses by category for given month ───────────────────────────

export async function getCategoryExpenses(
  year: number,
  month: number,
): Promise<CategoryExpense[]> {
  const db = getDb();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  const rows = db
    .prepare(
      `SELECT categoria, COALESCE(SUM(importe), 0) AS total
       FROM transacciones
       WHERE tipo = 'Gasto' AND fecha LIKE ?
       GROUP BY categoria
       ORDER BY total DESC`,
    )
    .all(`${prefix}%`) as CategoryExpense[];

  return rows;
}
