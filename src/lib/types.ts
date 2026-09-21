// ─── Domain Types ──────────────────────────────────────────────────────────────

export type TransactionType = 'Ingreso' | 'Gasto';

export interface Transaction {
  id: string;
  fecha: string; // ISO 8601 date string
  tipo: TransactionType;
  categoria: string;
  concepto: string;
  importe: number;
}

// ─── Form / Action Types ───────────────────────────────────────────────────────

export interface CreateTransactionInput {
  tipo: TransactionType;
  categoria: string;
  concepto: string;
  importe: number;
  fecha?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ─── KPI / Dashboard Types ─────────────────────────────────────────────────────

export interface KpiData {
  totalIngresos: number;
  totalGastos: number;
  beneficioNeto: number;
  tasaAhorro: number; // 0–100 %
}

export interface MonthlyProfit {
  mes: string;   // e.g. "Ene", "Feb"
  ingresos: number;
  gastos: number;
  beneficio: number;
}

export interface CategoryExpense {
  categoria: string;
  total: number;
}

export interface DailyBalance {
  fecha: string;   // "YYYY-MM-DD"
  ingresos: number;
  gastos: number;
  neto: number;
  acumulado: number;
}

export interface CategoryTrend {
  mes: string;
  [categoria: string]: number | string;
}

// ─── Time range ────────────────────────────────────────────────────────────────

export type TimePeriodPreset = '1M' | '3M' | '6M' | '1Y' | 'YTD';

export interface DateRange {
  from: string; // ISO date "YYYY-MM-DD"
  to: string;   // ISO date "YYYY-MM-DD"
}

/** Resolves a preset to a concrete DateRange ending today */
export function presetToRange(preset: TimePeriodPreset): DateRange {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const from = new Date(today);

  switch (preset) {
    case '1M':
      from.setMonth(from.getMonth() - 1);
      break;
    case '3M':
      from.setMonth(from.getMonth() - 3);
      break;
    case '6M':
      from.setMonth(from.getMonth() - 6);
      break;
    case '1Y':
      from.setFullYear(from.getFullYear() - 1);
      break;
    case 'YTD':
      from.setMonth(0);
      from.setDate(1);
      break;
  }

  return { from: from.toISOString().slice(0, 10), to };
}

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Built-in categories — cannot be deleted by the user */
export const BUILTIN_CATEGORIES = [
  'Comida',
  'Ocio',
  'Transporte',
  'Salud',
  'Suscripciones',
  'Ingresos',
  'Otro',
] as const;

export type BuiltinCategory = (typeof BUILTIN_CATEGORIES)[number];

/** Legacy map kept for backwards compat with datalist */
export const CATEGORIAS: Record<TransactionType, string[]> = {
  Ingreso: ['Ingresos', 'Otro'],
  Gasto: ['Comida', 'Ocio', 'Transporte', 'Salud', 'Suscripciones', 'Otro'],
};

export const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];
