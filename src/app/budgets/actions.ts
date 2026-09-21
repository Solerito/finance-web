'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { type ActionResult } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Presupuesto {
  id: string;
  categoria: string;
  limite_mensual: number;
  activo: number; // 1 | 0
}

export interface PresupuestoConProgreso extends Presupuesto {
  gastado: number;
  restante: number;
  porcentaje: number; // 0–100+
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return {
    from: `${y}-${m}-01T00:00:00Z`,
    to:   `${y}-${m}-${lastDay}T23:59:59Z`,
  };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getBudgets(): Promise<Presupuesto[]> {
  const db = getDb();
  return db
    .prepare(`SELECT id, categoria, limite_mensual, activo FROM presupuestos ORDER BY categoria`)
    .all() as Presupuesto[];
}

export async function getBudgetsWithProgress(): Promise<PresupuestoConProgreso[]> {
  const db = getDb();
  const { from, to } = currentMonthRange();

  const budgets = db
    .prepare(`SELECT id, categoria, limite_mensual, activo FROM presupuestos ORDER BY categoria`)
    .all() as Presupuesto[];

  return budgets.map((b) => {
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(importe), 0) AS gastado
         FROM transacciones
         WHERE tipo = 'Gasto' AND categoria = ? AND fecha >= ? AND fecha <= ?`,
      )
      .get(b.categoria, from, to) as { gastado: number };

    const gastado = row.gastado;
    const restante = b.limite_mensual - gastado;
    const porcentaje = (gastado / b.limite_mensual) * 100;
    return { ...b, gastado, restante, porcentaje };
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createBudget(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const categoria      = (formData.get('categoria') as string)?.trim();
    const limiteMensual  = parseFloat(formData.get('limite_mensual') as string);

    if (!categoria) return { success: false, error: 'La categoría es obligatoria' };
    if (isNaN(limiteMensual) || limiteMensual <= 0)
      return { success: false, error: 'El límite debe ser un número positivo' };

    const db = getDb();
    const existing = db.prepare(`SELECT id FROM presupuestos WHERE categoria = ?`).get(categoria);
    if (existing) return { success: false, error: `Ya existe un presupuesto para "${categoria}"` };

    db.prepare(
      `INSERT INTO presupuestos (id, categoria, limite_mensual) VALUES (?, ?, ?)`,
    ).run(generateId(), categoria, limiteMensual);

    revalidatePath('/budgets');
    return { success: true };
  } catch (err) {
    console.error('[createBudget]', err);
    return { success: false, error: 'Error al crear el presupuesto' };
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateBudget(
  id: string,
  limiteMensual: number,
): Promise<ActionResult> {
  try {
    if (!id?.trim()) return { success: false, error: 'ID inválido' };
    if (isNaN(limiteMensual) || limiteMensual <= 0)
      return { success: false, error: 'El límite debe ser un número positivo' };

    getDb().prepare(`UPDATE presupuestos SET limite_mensual = ? WHERE id = ?`).run(limiteMensual, id);
    revalidatePath('/budgets');
    return { success: true };
  } catch (err) {
    console.error('[updateBudget]', err);
    return { success: false, error: 'Error al actualizar el presupuesto' };
  }
}

// ─── Toggle active ────────────────────────────────────────────────────────────

export async function toggleBudget(id: string): Promise<ActionResult> {
  try {
    getDb().prepare(`UPDATE presupuestos SET activo = ((activo + 1) % 2) WHERE id = ?`).run(id);
    revalidatePath('/budgets');
    return { success: true };
  } catch (err) {
    console.error('[toggleBudget]', err);
    return { success: false, error: 'Error al actualizar el presupuesto' };
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteBudget(id: string): Promise<ActionResult> {
  try {
    if (!id?.trim()) return { success: false, error: 'ID inválido' };
    getDb().prepare(`DELETE FROM presupuestos WHERE id = ?`).run(id);
    revalidatePath('/budgets');
    return { success: true };
  } catch (err) {
    console.error('[deleteBudget]', err);
    return { success: false, error: 'Error al eliminar el presupuesto' };
  }
}
