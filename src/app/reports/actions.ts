'use server';

import { getDb } from '@/lib/db';
import { presetToRange } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Scatter Data (Income vs Expense correlation by day) ──────────────────────

export async function getScatterData() {
  const { from, to } = presetToRange('6M');
  const db = getDb();

  const rows = db.prepare(`
    SELECT
      strftime('%Y-%m-%d', fecha) as dia,
      SUM(CASE WHEN tipo='Ingreso' THEN importe ELSE 0 END) as ingresos,
      SUM(CASE WHEN tipo='Gasto' THEN importe ELSE 0 END) as gastos
    FROM transacciones
    WHERE fecha >= ? AND fecha <= ?
    GROUP BY dia
    HAVING ingresos > 0 OR gastos > 0
  `).all(from, `${to}T23:59:59Z`) as { dia: string; ingresos: number; gastos: number }[];

  return rows.map(r => ({
    ...r,
    label: format(parseISO(r.dia), 'd MMM', { locale: es }),
  }));
}

// ─── Waterfall Data (Monthly cashflow) ────────────────────────────────────────

export async function getWaterfallData() {
  const { from, to } = presetToRange('6M');
  const db = getDb();

  const rows = db.prepare(`
    SELECT
      strftime('%Y-%m', fecha) as mes,
      SUM(CASE WHEN tipo='Ingreso' THEN importe ELSE 0 END) as ingresos,
      SUM(CASE WHEN tipo='Gasto' THEN importe ELSE 0 END) as gastos
    FROM transacciones
    WHERE fecha >= ? AND fecha <= ?
    GROUP BY mes
    ORDER BY mes ASC
  `).all(from, `${to}T23:59:59Z`) as { mes: string; ingresos: number; gastos: number }[];

  // Convert to waterfall format
  let balance = 0;
  return rows.map(r => {
    const prevBalance = balance;
    const neto = r.ingresos - r.gastos;
    balance += neto;
    return {
      mes: format(parseISO(r.mes + '-01'), 'MMM yyyy', { locale: es }),
      start: prevBalance,
      end: balance,
      ingresos: r.ingresos,
      gastos: r.gastos,
      neto,
    };
  });
}

// ─── Funnel Data (Top categories breakdown) ───────────────────────────────────

export async function getFunnelData() {
  const { from, to } = presetToRange('3M');
  const db = getDb();

  const rows = db.prepare(`
    SELECT categoria, SUM(importe) as total
    FROM transacciones
    WHERE tipo='Gasto' AND fecha >= ? AND fecha <= ?
    GROUP BY categoria
    ORDER BY total DESC
    LIMIT 6
  `).all(from, `${to}T23:59:59Z`) as { categoria: string; total: number }[];

  return rows;
}

// ─── Radar Data (Financial Health Score 0-100) ────────────────────────────────

export async function getRadarData() {
  const db = getDb();
  const { from, to } = presetToRange('1M');

  // 1. Tasa de Ahorro
  const kpi = db.prepare(`
    SELECT
      SUM(CASE WHEN tipo='Ingreso' THEN importe ELSE 0 END) as i,
      SUM(CASE WHEN tipo='Gasto' THEN importe ELSE 0 END) as g
    FROM transacciones WHERE fecha >= ? AND fecha <= ?
  `).get(from, `${to}T23:59:59Z`) as { i: number; g: number };
  
  let ahorroScore = 0;
  if (kpi.i > 0) {
    const tasa = ((kpi.i - kpi.g) / kpi.i) * 100;
    ahorroScore = Math.max(0, Math.min(100, tasa * 2)); // 50% ahorro = 100 score
  }

  // 2. Control de Presupuesto
  const budgets = db.prepare(`SELECT SUM(limite_mensual) as l FROM presupuestos WHERE activo=1`).get() as { l: number };
  let budgetScore = 100;
  if (budgets.l > 0 && kpi.g > 0) {
    const uso = (kpi.g / budgets.l) * 100;
    budgetScore = Math.max(0, 100 - Math.max(0, uso - 80)); // Empieza a penalizar si pasa del 80%
  } else if (!budgets.l) {
    budgetScore = 0; // Sin presupuestos definidos
  }

  // 3. Avance de Metas
  const metas = db.prepare(`SELECT SUM(aportado) as a, SUM(objetivo) as o FROM metas`).get() as { a: number; o: number };
  const metasScore = metas.o > 0 ? (metas.a / metas.o) * 100 : 0;

  // 4. Estabilidad (Días sin gastos grandes)
  const bigSpends = db.prepare(`
    SELECT COUNT(*) as c FROM transacciones 
    WHERE tipo='Gasto' AND importe > 200 AND fecha >= ? AND fecha <= ?
  `).get(from, `${to}T23:59:59Z`) as { c: number };
  const estabilidadScore = Math.max(0, 100 - (bigSpends.c * 15));

  // 5. Liquidez (Ingresos vs Gastos absolutos)
  const liquidezScore = kpi.i > kpi.g * 1.2 ? 100 : kpi.i > kpi.g ? 75 : kpi.i === 0 ? 0 : 40;

  return [
    { subject: 'Ahorro', A: Math.round(ahorroScore), fullMark: 100 },
    { subject: 'Presupuesto', A: Math.round(budgetScore), fullMark: 100 },
    { subject: 'Metas', A: Math.round(metasScore), fullMark: 100 },
    { subject: 'Estabilidad', A: Math.round(estabilidadScore), fullMark: 100 },
    { subject: 'Liquidez', A: Math.round(liquidezScore), fullMark: 100 },
  ];
}
