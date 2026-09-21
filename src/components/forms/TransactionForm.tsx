'use client';

import { useActionState, useEffect, useRef, useTransition, useState } from 'react';
import { createTransaction } from '@/actions/transactions';
import { addCustomCategory, deleteCustomCategory } from '@/actions/categories';
import { BUILTIN_CATEGORIES, type ActionResult } from '@/lib/types';
import { PlusCircle, Loader2, Tag, X, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

const INITIAL_STATE: ActionResult = { success: false };
const ADD_INITIAL: ActionResult  = { success: false };

// ─── Sub-component: Category Manager ─────────────────────────────────────────

interface CategoryManagerProps {
  customCategories: string[];
  onCategoryAdded: (name: string) => void;
  onCategoryDeleted: (name: string) => void;
}

function CategoryManager({ customCategories, onCategoryAdded, onCategoryDeleted }: CategoryManagerProps) {
  const [addState, addAction, isAddPending] = useActionState(addCustomCategory, ADD_INITIAL);
  const [deletePending, startDeleteTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const addRef = useRef<HTMLFormElement>(null);

  // When a new category is successfully added, notify parent & hide input
  useEffect(() => {
    if (addState.success) {
      const form = addRef.current;
      const input = form?.querySelector('input[name="nombre"]') as HTMLInputElement | null;
      if (input) {
        onCategoryAdded(input.value.trim());
      }
      form?.reset();
      setShowAdd(false);
    }
  }, [addState, onCategoryAdded]);

  function handleDelete(nombre: string) {
    startDeleteTransition(async () => {
      const result = await deleteCustomCategory(nombre);
      if (result.success) {
        onCategoryDeleted(nombre);
      }
    });
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Custom categories list */}
      {customCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customCategories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs"
              style={{
                background: 'rgba(155,142,196,0.1)',
                border: '1px solid rgba(155,142,196,0.25)',
                color: '#c4b8e8',
              }}
            >
              {cat}
              <button
                type="button"
                onClick={() => handleDelete(cat)}
                disabled={deletePending}
                aria-label={`Eliminar categoría ${cat}`}
                className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add new category */}
      {showAdd ? (
        <form ref={addRef} action={addAction} className="flex gap-1.5">
          <input
            name="nombre"
            type="text"
            placeholder="Nombre de la categoría..."
            required
            maxLength={50}
            autoFocus
            className="input-paper flex-1 text-xs py-1.5"
          />
          <button
            type="submit"
            disabled={isAddPending}
            className="trp-btn active text-xs px-3 disabled:opacity-40"
          >
            {isAddPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Añadir'}
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(false)}
            className="trp-btn text-xs px-2"
          >
            <X className="w-3 h-3" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-xs text-[#9096b0] hover:text-[#c4b8e8] transition-colors"
        >
          <Plus className="w-3 h-3" />
          Añadir categoría
        </button>
      )}

      {addState.error && (
        <p className="text-[#c49090] text-xs">{addState.error}</p>
      )}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

interface TransactionFormProps {
  initialCustomCategories: string[];
}

export function TransactionForm({ initialCustomCategories = [] }: TransactionFormProps) {
  const [state, formAction, isPending] = useActionState(createTransaction, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  // Local state for live category management (optimistic)
  const [customCategories, setCustomCategories] = useState<string[]>(initialCustomCategories);

  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast('Transacción registrada correctamente', 'success');
    } else if (state.error) {
      toast(state.error, 'error');
    }
  }, [state, toast]);

  // Focus the amount input if accessed via global shortcut hash
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#new-tx') {
      document.getElementById('tx-importe')?.focus();
      // Limpiamos el hash para que se pueda volver a disparar
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="card p-5 space-y-5">
      {/* Form */}
      <div>
        <h2 className="text-sm font-semibold text-[#f0ece4] mb-4 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-[#9b8ec4]" />
          Nueva Transacción
        </h2>

        <form ref={formRef} action={formAction} className="space-y-4">
          {/* Tipo */}
          <div>
            <label htmlFor="tipo" className="block section-label mb-1.5">Tipo</label>
            <select id="tipo" name="tipo" required defaultValue="Gasto" className="input-paper w-full">
              <option value="Ingreso">Ingreso</option>
              <option value="Gasto">Gasto</option>
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="fecha" className="block section-label mb-1.5">Fecha</label>
            <input
              id="fecha"
              name="fecha"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="input-paper w-full"
            />
          </div>

          {/* Categoría — select with all categories */}
          <div>
            <label htmlFor="categoria" className="block section-label mb-1.5">Categoría</label>
            <select id="categoria" name="categoria" required defaultValue="" className="input-paper w-full">
              <option value="" disabled>Selecciona una categoría…</option>
              <optgroup label="Predefinidas">
                {BUILTIN_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </optgroup>
              {customCategories.length > 0 && (
                <optgroup label="Mis categorías">
                  {customCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Concepto */}
          <div>
            <label htmlFor="concepto" className="block section-label mb-1.5">Concepto</label>
            <input
              id="concepto"
              name="concepto"
              type="text"
              placeholder="Descripción del movimiento..."
              required
              maxLength={200}
              className="input-paper w-full"
            />
          </div>

          {/* Importe */}
          <div>
            <label htmlFor="tx-importe" className="block section-label mb-1.5">Importe (€)</label>
            <input
              id="tx-importe"
              name="importe"
              type="number"
              placeholder="0.00"
              required
              min="0.01"
              step="0.01"
              className="input-paper w-full font-editorial text-base"
            />
          </div>



          {/* Submit */}
          <button
            id="submit-transaction"
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(155,142,196,0.15)',
              border: '1px solid rgba(155,142,196,0.35)',
              color: '#c4b8e8',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(155,142,196,0.25)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(155,142,196,0.15)'; }}
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>
            ) : (
              <><PlusCircle className="w-4 h-4" />Registrar</>
            )}
          </button>
        </form>
      </div>

      {/* Divider */}
      <hr className="divider" />

      {/* Category manager */}
      <div>
        <p className="text-sm font-semibold text-[#f0ece4] flex items-center gap-2 mb-1">
          <Tag className="w-4 h-4 text-[#6b8cae]" />
          Mis Categorías
        </p>
        <p className="section-label mb-3">Añade o elimina tus categorías personalizadas</p>
        <CategoryManager
          customCategories={customCategories}
          onCategoryAdded={(name) =>
            setCustomCategories((prev) =>
              [...prev, name].sort((a, b) => a.localeCompare(b, 'es')),
            )
          }
          onCategoryDeleted={(name) =>
            setCustomCategories((prev) => prev.filter((c) => c !== name))
          }
        />
        {/* Built-in categories — readonly display */}
        <div className="mt-3 pt-3 border-t border-[rgba(240,236,228,0.06)]">
          <p className="section-label mb-2">Predefinidas (no eliminables)</p>
          <div className="flex flex-wrap gap-1.5">
            {BUILTIN_CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs"
                style={{
                  background: 'rgba(240,236,228,0.05)',
                  border: '1px solid rgba(240,236,228,0.1)',
                  color: '#9096b0',
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
