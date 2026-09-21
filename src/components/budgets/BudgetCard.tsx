'use client';

import { useTransition, useState } from 'react';
import { type PresupuestoConProgreso } from '@/app/budgets/actions';
import { deleteBudget, updateBudget, toggleBudget } from '@/app/budgets/actions';
import { Trash2, Pencil, Check, X, EyeOff } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function getBarColor(pct: number): string {
  if (pct >= 100) return '#b08080';   // dusty-rose — over budget
  if (pct >= 80)  return '#c9a96e';   // warm-tan — warning
  return '#7db88f';                   // sage — ok
}

function getBarGlow(pct: number): string {
  if (pct >= 100) return '0 0 12px rgba(176,128,128,0.4)';
  if (pct >= 80)  return '0 0 12px rgba(201,169,110,0.3)';
  return '0 0 12px rgba(125,184,143,0.3)';
}

// ─── Inline edit for limit ────────────────────────────────────────────────────

function EditLimit({ id, current, onDone }: { id: string; current: number; onDone: () => void }) {
  const [value, setValue] = useState(String(current));
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const n = parseFloat(value);
    if (isNaN(n) || n <= 0) return;
    startTransition(async () => {
      await updateBudget(id, n);
      onDone();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onDone(); }}
        className="input-paper w-28 py-1 text-sm text-right tabular-nums"
        autoFocus
        min="0.01"
        step="0.01"
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="p-1 rounded text-[#7db88f] hover:bg-[rgba(125,184,143,0.1)] transition-colors"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onDone}
        className="p-1 rounded text-[#5a5f75] hover:bg-[rgba(240,236,228,0.05)] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── BudgetCard ───────────────────────────────────────────────────────────────

interface BudgetCardProps {
  budget: PresupuestoConProgreso;
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const pct      = Math.min(budget.porcentaje, 100);
  const barColor = getBarColor(budget.porcentaje);
  const isOver   = budget.porcentaje >= 100;
  const isInactive = budget.activo === 0;

  function handleDelete() {
    if (!confirm(`¿Eliminar el presupuesto de "${budget.categoria}"?`)) return;
    startTransition(() => { void deleteBudget(budget.id); });
  }

  function handleToggle() {
    startTransition(() => { void toggleBudget(budget.id); });
  }

  return (
    <div
      className={[
        'card p-5 flex flex-col gap-4 transition-opacity',
        isInactive ? 'opacity-50' : '',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#f0ece4]">{budget.categoria}</p>
          {isOver && (
            <span className="text-[11px] text-[#b08080] font-medium">
              ⚠ Límite superado
            </span>
          )}
          {isInactive && (
            <span className="text-[11px] text-[#5a5f75]">Desactivado</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-[#5a5f75] hover:text-[#9096b0] hover:bg-[rgba(240,236,228,0.05)] transition-colors"
            title="Editar límite"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="p-1.5 rounded-lg text-[#5a5f75] hover:text-[#9096b0] hover:bg-[rgba(240,236,228,0.05)] transition-colors"
            title={isInactive ? 'Activar' : 'Desactivar'}
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 rounded-lg text-[#5a5f75] hover:text-[#b08080] hover:bg-[rgba(176,128,128,0.1)] transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 rounded-full bg-[rgba(240,236,228,0.06)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: barColor,
              boxShadow: getBarGlow(budget.porcentaje),
            }}
          />
        </div>
        <div className="flex justify-between items-center text-xs">
          <span style={{ color: barColor }} className="font-medium tabular-nums">
            {formatEur(budget.gastado)} gastado
          </span>
          <span className="text-[#5a5f75] tabular-nums">
            {budget.porcentaje.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Limit row */}
      <div className="flex items-center justify-between pt-1 border-t border-[rgba(240,236,228,0.06)]">
        <span className="text-xs text-[#5a5f75]">Límite mensual</span>
        {editing ? (
          <EditLimit
            id={budget.id}
            current={budget.limite_mensual}
            onDone={() => setEditing(false)}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-editorial text-[#f0ece4] tabular-nums hover:text-[#9b8ec4] transition-colors"
            title="Click para editar"
          >
            {formatEur(budget.limite_mensual)}
          </button>
        )}
      </div>

      {/* Restante */}
      <div className="flex items-center justify-between -mt-2">
        <span className="text-xs text-[#5a5f75]">Restante</span>
        <span
          className="text-sm font-medium tabular-nums"
          style={{ color: budget.restante >= 0 ? '#7db88f' : '#b08080' }}
        >
          {budget.restante >= 0 ? formatEur(budget.restante) : `−${formatEur(Math.abs(budget.restante))}`}
        </span>
      </div>
    </div>
  );
}
