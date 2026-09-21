'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { type ActionResult } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Meta {
  id: string;
  nombre: string;
  objetivo: number;
  aportado: number;
  fecha_objetivo: string | null;
  icono: string;
  color: string;
}

export interface MetaConProgreso extends Meta {
  porcentaje: number;       // 0–100+
  restante: number;
  diasRestantes: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string { return crypto.randomUUID(); }

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getGoals(): Promise<MetaConProgreso[]> {
  const db = getDb();
  const rows = db
    .prepare(`SELECT id, nombre, objetivo, aportado, fecha_objetivo, icono, color FROM metas ORDER BY rowid DESC`)
    .all() as Meta[];

  const today = new Date();
  return rows.map((m) => {
    const porcentaje  = (m.aportado / m.objetivo) * 100;
    const restante    = m.objetivo - m.aportado;
    let diasRestantes: number | null = null;
    if (m.fecha_objetivo) {
      const diff = new Date(m.fecha_objetivo).getTime() - today.getTime();
      diasRestantes = Math.ceil(diff / 86_400_000);
    }
    return { ...m, porcentaje, restante, diasRestantes };
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createGoal(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const nombre        = (formData.get('nombre') as string)?.trim();
    const objetivo      = parseFloat(formData.get('objetivo') as string);
    const fecha_obj_str = (formData.get('fecha_objetivo') as string)?.trim() || null;
    const icono         = (formData.get('icono') as string)?.trim() || '🎯';
    const color         = (formData.get('color') as string)?.trim() || '#9b8ec4';

    if (!nombre) return { success: false, error: 'El nombre es obligatorio' };
    if (isNaN(objetivo) || objetivo <= 0) return { success: false, error: 'El objetivo debe ser positivo' };

    getDb().prepare(
      `INSERT INTO metas (id, nombre, objetivo, fecha_objetivo, icono, color) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(generateId(), nombre, objetivo, fecha_obj_str, icono, color);

    revalidatePath('/goals');
    return { success: true };
  } catch (err) {
    console.error('[createGoal]', err);
    return { success: false, error: 'Error al crear la meta' };
  }
}

// ─── Add contribution ─────────────────────────────────────────────────────────

export async function addContribution(id: string, amount: number): Promise<ActionResult> {
  try {
    if (!id?.trim()) return { success: false, error: 'ID inválido' };
    if (isNaN(amount) || amount <= 0) return { success: false, error: 'Importe inválido' };

    getDb().prepare(
      `UPDATE metas SET aportado = MIN(objetivo, aportado + ?) WHERE id = ?`,
    ).run(amount, id);

    revalidatePath('/goals');
    return { success: true };
  } catch (err) {
    console.error('[addContribution]', err);
    return { success: false, error: 'Error al registrar la aportación' };
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateGoal(id: string, data: Partial<Pick<Meta, 'nombre' | 'objetivo' | 'fecha_objetivo' | 'icono' | 'color'>>): Promise<ActionResult> {
  try {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.nombre    !== undefined) { fields.push('nombre = ?');         values.push(data.nombre); }
    if (data.objetivo  !== undefined) { fields.push('objetivo = ?');        values.push(data.objetivo); }
    if (data.fecha_objetivo !== undefined) { fields.push('fecha_objetivo = ?'); values.push(data.fecha_objetivo); }
    if (data.icono     !== undefined) { fields.push('icono = ?');           values.push(data.icono); }
    if (data.color     !== undefined) { fields.push('color = ?');           values.push(data.color); }

    if (fields.length === 0) return { success: false, error: 'Sin cambios' };
    getDb().prepare(`UPDATE metas SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
    revalidatePath('/goals');
    return { success: true };
  } catch (err) {
    console.error('[updateGoal]', err);
    return { success: false, error: 'Error al actualizar la meta' };
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteGoal(id: string): Promise<ActionResult> {
  try {
    getDb().prepare(`DELETE FROM metas WHERE id = ?`).run(id);
    revalidatePath('/goals');
    return { success: true };
  } catch (err) {
    console.error('[deleteGoal]', err);
    return { success: false, error: 'Error al eliminar la meta' };
  }
}
