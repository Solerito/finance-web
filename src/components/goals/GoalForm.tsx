'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createGoal } from '@/app/goals/actions';
import { type ActionResult } from '@/lib/types';
import { Target } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

const INITIAL: ActionResult = { success: false };

const ICONOS = ['🎯', '🏠', '✈️', '🚗', '💻', '📱', '🎓', '💊', '🎸', '🌴', '💍', '🐕'];
const COLORES = [
  { label: 'Lavanda', value: '#9b8ec4' },
  { label: 'Sage',    value: '#7db88f' },
  { label: 'Steel',   value: '#6b8cae' },
  { label: 'Tan',     value: '#c9a96e' },
  { label: 'Rose',    value: '#b08080' },
];

export function GoalForm() {
  const [state, action, isPending] = useActionState(createGoal, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast('Meta creada con éxito', 'success');
    } else if (state.error) {
      toast(state.error, 'error');
    }
  }, [state, toast]);

  return (
    <div className="card p-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
      <h2 className="text-sm font-semibold text-[#f0ece4] flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-[#7db88f]" />
        Nueva Meta
      </h2>

      <form ref={formRef} action={action} className="space-y-3">
        {/* Nombre */}
        <div className="space-y-1.5">
          <label className="section-label block" htmlFor="goal-nombre">Nombre</label>
          <input
            id="goal-nombre"
            name="nombre"
            type="text"
            placeholder="Fondo de emergencia"
            required
            className="input-paper w-full"
          />
        </div>

        {/* Objetivo */}
        <div className="space-y-1.5">
          <label className="section-label block" htmlFor="goal-objetivo">Objetivo (€)</label>
          <input
            id="goal-objetivo"
            name="objetivo"
            type="number"
            placeholder="5000.00"
            min="0.01" step="0.01"
            required
            className="input-paper w-full"
          />
        </div>

        {/* Fecha límite */}
        <div className="space-y-1.5">
          <label className="section-label block" htmlFor="goal-fecha">Fecha objetivo</label>
          <input
            id="goal-fecha"
            name="fecha_objetivo"
            type="date"
            className="input-paper w-full"
          />
        </div>

        {/* Icono picker */}
        <div className="space-y-1.5">
          <p className="section-label">Icono</p>
          <div className="flex flex-wrap gap-2">
            {ICONOS.map((ico, i) => (
              <label key={ico} className="cursor-pointer">
                <input
                  type="radio"
                  name="icono"
                  value={ico}
                  defaultChecked={i === 0}
                  className="sr-only peer"
                />
                <span className="text-xl peer-checked:ring-2 peer-checked:ring-[#9b8ec4] rounded-lg p-1 block hover:bg-[rgba(240,236,228,0.05)] transition-all">
                  {ico}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="space-y-1.5">
          <p className="section-label">Color</p>
          <div className="flex gap-2">
            {COLORES.map((c, i) => (
              <label key={c.value} className="cursor-pointer" title={c.label}>
                <input
                  type="radio"
                  name="color"
                  value={c.value}
                  defaultChecked={i === 0}
                  className="sr-only peer"
                />
                <span
                  className="w-7 h-7 rounded-full block border-2 border-transparent peer-checked:border-white peer-checked:scale-110 transition-all"
                  style={{ background: c.value }}
                />
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-[#f0ece4]
            bg-[rgba(125,184,143,0.15)] border border-[rgba(125,184,143,0.3)]
            hover:bg-[rgba(125,184,143,0.25)] hover:border-[rgba(125,184,143,0.5)]
            disabled:opacity-50 transition-all mt-4"
        >
          {isPending ? 'Guardando…' : 'Crear Meta'}
        </button>
      </form>
    </div>
  );
}
