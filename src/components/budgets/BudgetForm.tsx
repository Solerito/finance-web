'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createBudget } from '@/app/budgets/actions';
import { type ActionResult, BUILTIN_CATEGORIES } from '@/lib/types';
import { PiggyBank } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

const INITIAL: ActionResult = { success: false };

export function BudgetForm({ categorias }: { categorias: string[] }) {
  const [state, action, isPending] = useActionState(createBudget, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast('Presupuesto creado con éxito', 'success');
    } else if (state.error) {
      toast(state.error, 'error');
    }
  }, [state, toast]);

  return (
    <div className="card p-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
      <h2 className="text-sm font-semibold text-[#f0ece4] flex items-center gap-2 mb-4">
        <PiggyBank className="w-4 h-4 text-[#9b8ec4]" />
        Nuevo Presupuesto
      </h2>

      <form ref={formRef} action={action} className="space-y-3">
        {/* Category */}
        <div className="space-y-1.5">
          <label className="section-label block" htmlFor="budget-cat">Categoría</label>
          <select
            id="budget-cat"
            name="categoria"
            required
            className="input-paper w-full cursor-pointer appearance-none"
            defaultValue=""
          >
            <option value="" disabled>Selecciona una categoría…</option>
            {BUILTIN_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            {categorias.filter(c => !BUILTIN_CATEGORIES.includes(c as any)).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Limit */}
        <div className="space-y-1.5">
          <label className="section-label block" htmlFor="budget-limit">Límite Mensual (€)</label>
          <input
            id="budget-limit"
            name="limite_mensual"
            type="number"
            placeholder="300.00"
            min="0.01" step="0.01"
            required
            className="input-paper w-full"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-[#f0ece4]
            bg-[rgba(155,142,196,0.15)] border border-[rgba(155,142,196,0.3)]
            hover:bg-[rgba(155,142,196,0.25)] hover:border-[rgba(155,142,196,0.5)]
            disabled:opacity-50 transition-all mt-4"
        >
          {isPending ? 'Guardando…' : 'Crear Presupuesto'}
        </button>
      </form>
    </div>
  );
}
