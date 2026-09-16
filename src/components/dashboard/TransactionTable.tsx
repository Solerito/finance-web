'use client';

import { useTransition } from 'react';
import { deleteTransaction } from '@/actions/transactions';
import { type Transaction } from '@/lib/types';
import { Trash2, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), 'dd MMM yyyy', { locale: es });
  } catch {
    return iso.split('T')[0];
  }
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// ─── Delete Button ────────────────────────────────────────────────────────

function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm('¿Eliminar esta transacción?')) return;
    startTransition(async () => {
      await deleteTransaction(id);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Eliminar transacción"
      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-40 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────

function TypeBadge({ tipo }: { tipo: Transaction['tipo'] }) {
  if (tipo === 'Ingreso') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        ↑ Ingreso
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/20">
      ↓ Gasto
    </span>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 pb-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          Historial de Transacciones
        </h3>
        <p className="text-slate-500 text-xs mt-1">Últimas {transactions.length} entradas</p>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-600">
          <span className="text-4xl mb-3">📭</span>
          <p className="text-sm">Sin transacciones registradas</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-white/5">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Importe
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-white/[0.03] transition-colors group"
                >
                  <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                    {formatDate(tx.fecha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TypeBadge tipo={tx.tipo} />
                  </td>
                  <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                    {tx.categoria}
                  </td>
                  <td className="px-6 py-4 text-slate-300 max-w-[200px] truncate">
                    {tx.concepto}
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-semibold whitespace-nowrap tabular-nums ${
                      tx.tipo === 'Ingreso' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.tipo === 'Ingreso' ? '+' : '-'}
                    {formatEur(tx.importe)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DeleteButton id={tx.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
