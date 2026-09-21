'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import { BUILTIN_CATEGORIES, type ActionResult } from '@/lib/types';

// ─── Read: all categories (built-in + custom) ─────────────────────────────────

export async function getAllCategories(): Promise<{
  builtin: string[];
  custom: string[];
}> {
  const db = getDb();
  const rows = db
    .prepare('SELECT nombre FROM categorias_personalizadas ORDER BY nombre')
    .all() as Array<{ nombre: string }>;

  return {
    builtin: [...BUILTIN_CATEGORIES],
    custom: rows.map((r) => r.nombre),
  };
}

// ─── Create: add a custom category ────────────────────────────────────────────

export async function addCustomCategory(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const nombre = (formData.get('nombre') as string)?.trim();

  if (!nombre) {
    return { success: false, error: 'El nombre no puede estar vacío' };
  }
  if (nombre.length > 50) {
    return { success: false, error: 'Máximo 50 caracteres' };
  }

  // Cannot duplicate built-in
  const builtinLower = BUILTIN_CATEGORIES.map((c) => c.toLowerCase());
  if (builtinLower.includes(nombre.toLowerCase())) {
    return { success: false, error: 'Esa categoría ya existe' };
  }

  try {
    const db = getDb();
    db.prepare('INSERT OR IGNORE INTO categorias_personalizadas (nombre) VALUES (?)').run(nombre);
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('[addCustomCategory]', err);
    return { success: false, error: 'Error al guardar la categoría' };
  }
}

// ─── Delete: remove a custom category ─────────────────────────────────────────

export async function deleteCustomCategory(nombre: string): Promise<ActionResult> {
  // Guard: never delete built-in categories
  const builtinLower = BUILTIN_CATEGORIES.map((c) => c.toLowerCase());
  if (builtinLower.includes(nombre.toLowerCase())) {
    return { success: false, error: 'No se pueden eliminar categorías predefinidas' };
  }

  try {
    const db = getDb();
    db.prepare('DELETE FROM categorias_personalizadas WHERE nombre = ?').run(nombre);
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    console.error('[deleteCustomCategory]', err);
    return { success: false, error: 'Error al eliminar la categoría' };
  }
}
