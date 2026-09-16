'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createTransaction } from '@/actions/transactions';
import { CATEGORIAS, type TransactionType, type ActionResult } from '@/lib/types';
import { PlusCircle, Loader2 } from 'lucide-react';

const INITIAL_STATE: ActionResult = { success: false };

export function TransactionForm() {
  const [state, formAction, isPending] = useActionState(createTransaction, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form on successful submission
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-white mb-5 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-indigo-400" />
        Nueva Transacción
      </h2>

      <form ref={formRef} action={formAction} className="space-y-4">
        {/* Tipo + Fecha row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-slate-300 mb-1">
              Tipo
            </label>
            <select
              id="tipo"
              name="tipo"
              required
              defaultValue="Gasto"
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              <option value="Ingreso">💚 Ingreso</option>
              <option value="Gasto">🔴 Gasto</option>
            </select>
          </div>

          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-slate-300 mb-1">
              Fecha
            </label>
            <input
              id="fecha"
              name="fecha"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-slate-300 mb-1">
            Categoría
          </label>
          {/* We use a datalist so users can pick from presets OR type a custom value */}
          <input
            id="categoria"
            name="categoria"
            list="categorias-list"
            placeholder="Selecciona o escribe una categoría..."
            required
            className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          <datalist id="categorias-list">
            {[
              ...CATEGORIAS.Ingreso,
              ...CATEGORIAS.Gasto,
            ].map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        {/* Concepto */}
        <div>
          <label htmlFor="concepto" className="block text-sm font-medium text-slate-300 mb-1">
            Concepto
          </label>
          <input
            id="concepto"
            name="concepto"
            type="text"
            placeholder="Descripción del movimiento..."
            required
            maxLength={200}
            className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        {/* Importe */}
        <div>
          <label htmlFor="importe" className="block text-sm font-medium text-slate-300 mb-1">
            Importe (€)
          </label>
          <input
            id="importe"
            name="importe"
            type="number"
            placeholder="0.00"
            required
            min="0.01"
            step="0.01"
            className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        {/* Feedback messages */}
        {state.error && (
          <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            ⚠️ {state.error}
          </p>
        )}
        {state.success && (
          <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            ✅ Transacción registrada correctamente
          </p>
        )}

        {/* Submit */}
        <button
          id="submit-transaction"
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-all duration-200 shadow-lg shadow-indigo-500/20"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              Registrar transacción
            </>
          )}
        </button>
      </form>
    </div>
  );
}
