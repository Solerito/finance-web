// ─── Domain Types ──────────────────────────────────────────────────────────

export type TransactionType = 'Ingreso' | 'Gasto';

export interface Transaction {
  id: string;
  fecha: string; // ISO 8601 date string
  tipo: TransactionType;
  categoria: string;
  concepto: string;
  importe: number;
}

// ─── Form / Action Types ───────────────────────────────────────────────────

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

// ─── KPI / Dashboard Types ─────────────────────────────────────────────────

export interface KpiData {
  totalIngresos: number;
  totalGastos: number;
  beneficioNeto: number;
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

// ─── Constants ─────────────────────────────────────────────────────────────

export const CATEGORIAS: Record<TransactionType, string[]> = {
  Ingreso: ['Nómina', 'Freelance', 'Inversiones', 'Alquiler cobrado', 'Otros ingresos'],
  Gasto: ['Alquiler', 'Comida', 'Transporte', 'Ocio', 'Salud', 'Educación', 'Ropa', 'Servicios', 'Otros gastos'],
};

export const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];
