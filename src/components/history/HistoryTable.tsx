'use client';

import { useTransition } from 'react';
import { deleteTransaction } from '@/actions/transactions';
import { type Transaction } from '@/lib/types';
import { Trash2, History as HistoryIcon, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try { return format(parseISO(iso), 'dd MMM yyyy', { locale: es }); }
  catch { return iso.slice(0, 10); }
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

function groupByDay(txs: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const day = tx.fecha.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(tx);
  }
  return map;
}

function dayLabel(iso: string): string {
  try { return format(parseISO(iso), "EEEE d 'de' MMMM yyyy", { locale: es }); }
  catch { return iso; }
}

// ─── Delete button ────────────────────────────────────────────────────────────

function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  function handleDelete() {
    if (!confirm('¿Eliminar esta transacción?')) return;
    startTransition(async () => { await deleteTransaction(id); });
  }
  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Eliminar transacción"
      className="p-1.5 rounded-lg text-[#5a5f75] hover:text-[#b08080] hover:bg-[rgba(176,128,128,0.1)] disabled:opacity-40 transition-colors opacity-0 group-hover:opacity-100"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

// ─── HistoryTable ─────────────────────────────────────────────────────────────

interface HistoryTableProps {
  transactions: Transaction[];
}

export function HistoryTable({ transactions }: HistoryTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 text-[#5a5f75] gap-3 animate-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(240,236,228,0.02)] border border-[rgba(240,236,228,0.05)] flex items-center justify-center mb-1">
          <HistoryIcon className="w-6 h-6 text-[#5a5f75] opacity-50" />
        </div>
        <p className="text-sm">Sin transacciones para los filtros aplicados</p>
      </div>
    );
  }

  const groups = groupByDay(transactions);

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([day, txs]) => {
        const ingresos = txs.filter(t => t.tipo === 'Ingreso').reduce((s, t) => s + t.importe, 0);
        const gastos   = txs.filter(t => t.tipo === 'Gasto').reduce((s, t) => s + t.importe, 0);
        const neto     = ingresos - gastos;

        return (
          <div key={day} className="card overflow-hidden">
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(240,236,228,0.07)] bg-[rgba(240,236,228,0.02)]">
              <p className="text-xs font-semibold text-[#c8c4bc] capitalize">{dayLabel(day)}</p>
              <div className="flex items-center gap-3 text-xs tabular-nums">
                {ingresos > 0 && (
                  <span className="text-[#7db88f]">+{formatEur(ingresos)}</span>
                )}
                {gastos > 0 && (
                  <span className="text-[#c49090]">−{formatEur(gastos)}</span>
                )}
                <span
                  className="font-medium"
                  style={{ color: neto >= 0 ? '#7db88f' : '#c49090' }}
                >
                  {neto >= 0 ? '+' : '−'}{formatEur(Math.abs(neto))}
                </span>
              </div>
            </div>

            {/* Transactions for this day */}
            <div className="divide-y divide-[rgba(240,236,228,0.04)]">
              {txs.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3 group hover:bg-[rgba(240,236,228,0.02)] transition-colors"
                >
                  {/* Type indicator dot */}
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: tx.tipo === 'Ingreso' ? '#7db88f' : '#b08080' }}
                  />

                  {/* Concepto + categoria */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#c8c4bc] truncate">{tx.concepto}</p>
                    <p className="text-[11px] text-[#5a5f75]">{tx.categoria}</p>
                  </div>

                  {/* Amount */}
                  <span
                    className={`font-editorial text-base tabular-nums shrink-0 ${
                      tx.tipo === 'Ingreso' ? 'text-[#7db88f]' : 'text-[#c49090]'
                    }`}
                  >
                    {tx.tipo === 'Ingreso' ? '+' : '−'}{formatEur(tx.importe)}
                  </span>

                  {/* Delete (reveal on hover) */}
                  <DeleteButton id={tx.id} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
