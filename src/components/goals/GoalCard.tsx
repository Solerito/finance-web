'use client';

import { useState, useTransition } from 'react';
import { type MetaConProgreso } from '@/app/goals/actions';
import { addContribution, deleteGoal } from '@/app/goals/actions';
import { Trash2, Plus, Check, X } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

// ─── Circular progress SVG ────────────────────────────────────────────────────

function CircularProgress({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const radius = (size - 10) / 2;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - Math.min(pct / 100, 1) * circ;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke="rgba(240,236,228,0.06)"
        strokeWidth={6}
      />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 4px ${color}80)` }}
      />
    </svg>
  );
}

// ─── Contribution inline form ─────────────────────────────────────────────────

function ContribForm({ id, onDone }: { id: string; onDone: () => void }) {
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const n = parseFloat(value);
    if (isNaN(n) || n <= 0) return;
    startTransition(async () => {
      await addContribution(id, n);
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
        placeholder="Importe €"
        min="0.01" step="0.01"
        className="input-paper w-28 py-1 text-sm text-right tabular-nums"
        autoFocus
      />
      <button onClick={handleSave} disabled={isPending} className="p-1 rounded text-[#7db88f] hover:bg-[rgba(125,184,143,0.1)] transition-colors">
        <Check className="w-3.5 h-3.5" />
      </button>
      <button onClick={onDone} className="p-1 rounded text-[#5a5f75] hover:bg-[rgba(240,236,228,0.05)] transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── GoalCard ─────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: MetaConProgreso;
}

export function GoalCard({ goal }: GoalCardProps) {
  const [contributing, setContributing] = useState(false);
  const [isPending, startTransition]    = useTransition();

  const pct       = Math.min(goal.porcentaje, 100);
  const isComplete = goal.porcentaje >= 100;

  function handleDelete() {
    if (!confirm(`¿Eliminar la meta "${goal.nombre}"?`)) return;
    startTransition(() => { void deleteGoal(goal.id); });
  }

  return (
    <div className="card p-5 flex flex-col gap-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Circular progress with emoji inside */}
          <div className="relative flex items-center justify-center">
            <CircularProgress pct={pct} color={goal.color} size={72} />
            <span className="absolute text-xl leading-none">{goal.icono}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#f0ece4]">{goal.nombre}</p>
            <p className="text-[11px] font-bold tabular-nums" style={{ color: goal.color }}>
              {pct.toFixed(0)}%
            </p>
            {isComplete && (
              <p className="text-[11px] text-[#7db88f] font-semibold">✓ Completado</p>
            )}
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="p-1.5 rounded-lg text-[#5a5f75] hover:text-[#b08080] hover:bg-[rgba(176,128,128,0.1)] transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress details */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[#9096b0]">Aportado</span>
          <span className="tabular-nums" style={{ color: goal.color }}>
            {formatEur(goal.aportado)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#9096b0]">Objetivo</span>
          <span className="text-[#f0ece4] tabular-nums font-medium">
            {formatEur(goal.objetivo)}
          </span>
        </div>
        {!isComplete && (
          <div className="flex justify-between text-xs">
            <span className="text-[#9096b0]">Restante</span>
            <span className="text-[#c8c4bc] tabular-nums">{formatEur(goal.restante)}</span>
          </div>
        )}
        {goal.fecha_objetivo && (
          <div className="flex justify-between text-xs">
            <span className="text-[#9096b0]">Plazo</span>
            <span className={`tabular-nums ${goal.diasRestantes !== null && goal.diasRestantes < 0 ? 'text-[#b08080]' : 'text-[#c8c4bc]'}`}>
              {goal.diasRestantes !== null
                ? goal.diasRestantes < 0
                  ? `Vencido hace ${Math.abs(goal.diasRestantes)}d`
                  : `${goal.diasRestantes}d restantes`
                : goal.fecha_objetivo}
            </span>
          </div>
        )}
      </div>

      {/* Contribute button */}
      {!isComplete && (
        <div className="pt-1 border-t border-[rgba(240,236,228,0.06)]">
          {contributing ? (
            <ContribForm id={goal.id} onDone={() => setContributing(false)} />
          ) : (
            <button
              onClick={() => setContributing(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#9096b0] hover:text-[#f0ece4] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir aportación
            </button>
          )}
        </div>
      )}
    </div>
  );
}
