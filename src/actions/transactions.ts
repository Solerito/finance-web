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
  type DailyBalance,
  type CategoryTrend,
  type DateRange,
  MESES_CORTOS,
} from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

// ─── Create ───────────────────────────────────────────────────────────────────

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

// ─── Delete ───────────────────────────────────────────────────────────────────

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

// ─── Read: latest transactions ────────────────────────────────────────────────

export async function getTransactions(limit = 50, range?: DateRange): Promise<Transaction[]> {
  const db = getDb();

  if (range) {
    const rows = db
      .prepare(
        `SELECT id, fecha, tipo, categoria, concepto, importe
         FROM transacciones
         WHERE fecha >= ? AND fecha <= ?
         ORDER BY fecha DESC
         LIMIT ?`,
      )
      .all(`${range.from}T00:00:00Z`, `${range.to}T23:59:59Z`, limit) as Transaction[];
    return rows;
  }

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

// ─── Read: KPIs for a date range ─────────────────────────────────────────────

export async function getKpisForRange(range: DateRange): Promise<KpiData> {
  const db = getDb();

  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo = 'Ingreso' THEN importe ELSE 0 END), 0) AS totalIngresos,
         COALESCE(SUM(CASE WHEN tipo = 'Gasto'   THEN importe ELSE 0 END), 0) AS totalGastos
       FROM transacciones
       WHERE fecha >= ? AND fecha <= ?`,
    )
    .get(`${range.from}T00:00:00Z`, `${range.to}T23:59:59Z`) as {
      totalIngresos: number;
      totalGastos: number;
    };

  const beneficioNeto = row.totalIngresos - row.totalGastos;
  const tasaAhorro =
    row.totalIngresos > 0
      ? Math.max(0, Math.min(100, (beneficioNeto / row.totalIngresos) * 100))
      : 0;

  return {
    totalIngresos: row.totalIngresos,
    totalGastos: row.totalGastos,
    beneficioNeto,
    tasaAhorro,
  };
}

// ─── Compat: KPIs for a given month (legacy) ─────────────────────────────────

export async function getKpis(year: number, month: number): Promise<KpiData> {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const db = getDb();

  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo = 'Ingreso' THEN importe ELSE 0 END), 0) AS totalIngresos,
         COALESCE(SUM(CASE WHEN tipo = 'Gasto'   THEN importe ELSE 0 END), 0) AS totalGastos
       FROM transacciones
       WHERE fecha LIKE ?`,
    )
    .get(`${prefix}%`) as { totalIngresos: number; totalGastos: number };

  const beneficioNeto = row.totalIngresos - row.totalGastos;
  const tasaAhorro =
    row.totalIngresos > 0
      ? Math.max(0, Math.min(100, (beneficioNeto / row.totalIngresos) * 100))
      : 0;

  return {
    totalIngresos: row.totalIngresos,
    totalGastos: row.totalGastos,
    beneficioNeto,
    tasaAhorro,
  };
}

// ─── Read: monthly profits for a date range ───────────────────────────────────

export async function getMonthlyProfitsForRange(range: DateRange): Promise<MonthlyProfit[]> {
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT
         strftime('%Y-%m', fecha) AS yearMonth,
         COALESCE(SUM(CASE WHEN tipo = 'Ingreso' THEN importe ELSE 0 END), 0) AS ingresos,
         COALESCE(SUM(CASE WHEN tipo = 'Gasto'   THEN importe ELSE 0 END), 0) AS gastos
       FROM transacciones
       WHERE fecha >= ? AND fecha <= ?
       GROUP BY yearMonth
       ORDER BY yearMonth`,
    )
    .all(`${range.from}T00:00:00Z`, `${range.to}T23:59:59Z`) as Array<{
      yearMonth: string;
      ingresos: number;
      gastos: number;
    }>;

  return rows.map((r) => {
    const [y, m] = r.yearMonth.split('-').map(Number);
    const ingresos = r.ingresos;
    const gastos = r.gastos;
    return {
      mes: `${MESES_CORTOS[m - 1]} ${String(y).slice(2)}`,
      ingresos,
      gastos,
      beneficio: ingresos - gastos,
    };
  });
}

// ─── Compat: monthly profits for given year (legacy) ─────────────────────────

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

// ─── Read: expenses by category for a date range ──────────────────────────────

export async function getCategoryExpensesForRange(range: DateRange): Promise<CategoryExpense[]> {
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT categoria, COALESCE(SUM(importe), 0) AS total
       FROM transacciones
       WHERE tipo = 'Gasto' AND fecha >= ? AND fecha <= ?
       GROUP BY categoria
       ORDER BY total DESC`,
    )
    .all(`${range.from}T00:00:00Z`, `${range.to}T23:59:59Z`) as CategoryExpense[];

  return rows;
}

// ─── Compat: expenses by category for given month (legacy) ────────────────────

export async function getCategoryExpenses(year: number, month: number): Promise<CategoryExpense[]> {
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

// ─── Read: daily balance evolution ───────────────────────────────────────────

export async function getDailyBalances(range: DateRange): Promise<DailyBalance[]> {
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT
         strftime('%Y-%m-%d', fecha) AS fecha,
         COALESCE(SUM(CASE WHEN tipo = 'Ingreso' THEN importe ELSE 0 END), 0) AS ingresos,
         COALESCE(SUM(CASE WHEN tipo = 'Gasto'   THEN importe ELSE 0 END), 0) AS gastos
       FROM transacciones
       WHERE fecha >= ? AND fecha <= ?
       GROUP BY strftime('%Y-%m-%d', fecha)
       ORDER BY fecha`,
    )
    .all(`${range.from}T00:00:00Z`, `${range.to}T23:59:59Z`) as Array<{
      fecha: string;
      ingresos: number;
      gastos: number;
    }>;

  let acumulado = 0;
  return rows.map((r) => {
    const neto = r.ingresos - r.gastos;
    acumulado += neto;
    return { fecha: r.fecha, ingresos: r.ingresos, gastos: r.gastos, neto, acumulado };
  });
}

// ─── Read: top-5 category trends by month ────────────────────────────────────

export async function getCategoryTrends(range: DateRange): Promise<CategoryTrend[]> {
  const db = getDb();

  // Find top 5 spending categories in the range
  const topCats = db
    .prepare(
      `SELECT categoria
       FROM transacciones
       WHERE tipo = 'Gasto' AND fecha >= ? AND fecha <= ?
       GROUP BY categoria
       ORDER BY SUM(importe) DESC
       LIMIT 5`,
    )
    .all(`${range.from}T00:00:00Z`, `${range.to}T23:59:59Z`) as Array<{ categoria: string }>;

  if (topCats.length === 0) return [];

  const cats = topCats.map((r) => r.categoria);

  // Monthly totals per category
  const rows = db
    .prepare(
      `SELECT
         strftime('%Y-%m', fecha) AS yearMonth,
         categoria,
         COALESCE(SUM(importe), 0) AS total
       FROM transacciones
       WHERE tipo = 'Gasto'
         AND fecha >= ? AND fecha <= ?
         AND categoria IN (${cats.map(() => '?').join(',')})
       GROUP BY yearMonth, categoria
       ORDER BY yearMonth`,
    )
    .all(`${range.from}T00:00:00Z`, `${range.to}T23:59:59Z`, ...cats) as Array<{
      yearMonth: string;
      categoria: string;
      total: number;
    }>;

  // Pivot into { mes, cat1: val, cat2: val, ... }
  const byMonth = new Map<string, CategoryTrend>();
  for (const row of rows) {
    if (!byMonth.has(row.yearMonth)) {
      const [y, m] = row.yearMonth.split('-').map(Number);
      byMonth.set(row.yearMonth, { mes: `${MESES_CORTOS[m - 1]} ${String(y).slice(2)}` });
    }
    byMonth.get(row.yearMonth)![row.categoria] = row.total;
  }

  return Array.from(byMonth.values());
}

// ─── Read: KPIs with comparison to previous period ───────────────────────────

export interface KpiComparison {
  current: KpiData;
  previous: KpiData;
  /** positive = improved, negative = worsened */
  ingresosDelta: number;   // percentage points
  gastosDelta: number;
  beneficioDelta: number;
  ahorroDelta: number;
}

function shiftRange(range: DateRange): DateRange {
  const from = new Date(range.from);
  const to   = new Date(range.to);
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  const prevTo   = new Date(from); prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo); prevFrom.setDate(prevFrom.getDate() - days + 1);
  return {
    from: prevFrom.toISOString().slice(0, 10),
    to:   prevTo.toISOString().slice(0, 10),
  };
}

function pctDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export async function getKpisComparison(range: DateRange): Promise<KpiComparison> {
  const [current, previous] = await Promise.all([
    getKpisForRange(range),
    getKpisForRange(shiftRange(range)),
  ]);
  return {
    current,
    previous,
    ingresosDelta:  pctDelta(current.totalIngresos, previous.totalIngresos),
    gastosDelta:    pctDelta(current.totalGastos,   previous.totalGastos),
    beneficioDelta: pctDelta(current.beneficioNeto, previous.beneficioNeto),
    ahorroDelta:    current.tasaAhorro - previous.tasaAhorro,
  };
}

// ─── Read: daily spending for heatmap ────────────────────────────────────────

export interface HeatmapDay {
  fecha: string;   // "YYYY-MM-DD"
  gastos: number;
}

export async function getHeatmapData(range: DateRange): Promise<HeatmapDay[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT strftime('%Y-%m-%d', fecha) AS fecha,
              COALESCE(SUM(importe), 0)   AS gastos
       FROM transacciones
       WHERE tipo = 'Gasto' AND fecha >= ? AND fecha <= ?
       GROUP BY strftime('%Y-%m-%d', fecha)
       ORDER BY fecha`,
    )
    .all(`${range.from}T00:00:00Z`, `${range.to}T23:59:59Z`) as HeatmapDay[];
  return rows;
}

// ─── Read: top N transactions by amount in range ──────────────────────────────

export async function getTopTransactions(
  range: DateRange,
  limit = 5,
): Promise<{ top_gastos: Transaction[]; top_ingresos: Transaction[] }> {
  const db = getDb();

  const top_gastos = db
    .prepare(
      `SELECT id, fecha, tipo, categoria, concepto, importe
       FROM transacciones
       WHERE tipo = 'Gasto' AND fecha >= ? AND fecha <= ?
       ORDER BY importe DESC LIMIT ?`,
    )
    .all(`${range.from}T00:00:00Z`, `${range.to}T23:59:59Z`, limit) as Transaction[];

  const top_ingresos = db
    .prepare(
      `SELECT id, fecha, tipo, categoria, concepto, importe
       FROM transacciones
       WHERE tipo = 'Ingreso' AND fecha >= ? AND fecha <= ?
       ORDER BY importe DESC LIMIT ?`,
    )
    .all(`${range.from}T00:00:00Z`, `${range.to}T23:59:59Z`, limit) as Transaction[];

  return { top_gastos, top_ingresos };
}

// ─── Update transaction ───────────────────────────────────────────────────────

export async function updateTransaction(
  id: string,
  data: { concepto?: string; categoria?: string; importe?: number },
): Promise<ActionResult> {
  try {
    if (!id?.trim()) return { success: false, error: 'ID inválido' };
    const db = getDb();
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (data.concepto !== undefined) {
      if (!data.concepto.trim()) return { success: false, error: 'Concepto vacío' };
      fields.push('concepto = ?'); values.push(data.concepto.trim());
    }
    if (data.categoria !== undefined) {
      if (!data.categoria.trim()) return { success: false, error: 'Categoría vacía' };
      fields.push('categoria = ?'); values.push(data.categoria.trim());
    }
    if (data.importe !== undefined) {
      if (isNaN(data.importe) || data.importe <= 0) return { success: false, error: 'Importe inválido' };
      fields.push('importe = ?'); values.push(data.importe);
    }
    if (fields.length === 0) return { success: false, error: 'Sin cambios' };

    db.prepare(`UPDATE transacciones SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('[updateTransaction]', err);
    return { success: false, error: 'Error al actualizar la transacción' };
  }
}

