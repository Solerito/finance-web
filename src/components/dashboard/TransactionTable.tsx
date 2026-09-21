'use client';

import { useState, useTransition, useMemo } from 'react';
import { deleteTransaction } from '@/actions/transactions';
import { type Transaction } from '@/lib/types';
import { Trash2, History, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Delete Button ────────────────────────────────────────────────────────────

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
      className="p-1.5 rounded-lg text-[#5a5f75] hover:text-[#b08080] hover:bg-[rgba(176,128,128,0.1)] disabled:opacity-40 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function TypeBadge({ tipo }: { tipo: Transaction['tipo'] }) {
  if (tipo === 'Ingreso') {
    return <span className="badge-income">↑ Ingreso</span>;
  }
  return <span className="badge-expense">↓ Gasto</span>;
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1 rounded-full text-xs font-medium border transition-all',
        active
          ? 'bg-[rgba(155,142,196,0.15)] border-[rgba(155,142,196,0.4)] text-[#c4b8e8]'
          : 'bg-transparent border-[rgba(240,236,228,0.1)] text-[#9096b0] hover:border-[rgba(240,236,228,0.2)] hover:text-[#f0ece4]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface TransactionTableProps {
  transactions: Transaction[];
  periodLabel?: string;
}

export function TransactionTable({ transactions, periodLabel }: TransactionTableProps) {
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'Ingreso' | 'Gasto'>('all');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [page, setPage] = useState(0);

  // Derive unique categories
  const allCategories = useMemo(() => {
    const cats = Array.from(new Set(transactions.map((t) => t.categoria))).sort();
    return cats;
  }, [transactions]);

  // Apply filters
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (filterTipo !== 'all' && tx.tipo !== filterTipo) return false;
      if (filterCat !== 'all' && tx.categoria !== filterCat) return false;
      if (q && !tx.concepto.toLowerCase().includes(q) && !tx.categoria.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [transactions, search, filterTipo, filterCat]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function resetPage() { setPage(0); }

  const hasActiveFilters = search || filterTipo !== 'all' || filterCat !== 'all';

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[rgba(240,236,228,0.07)]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#f0ece4] flex items-center gap-2">
              <History className="w-4 h-4 text-[#9096b0]" />
              Historial de Transacciones
            </h3>
            {periodLabel && (
              <p className="section-label mt-1">
                {periodLabel} · {filtered.length} de {transactions.length} entradas
              </p>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5a5f75]" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              className="input-paper pl-8 pr-8 py-1.5 text-xs w-44"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); resetPage(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a5f75] hover:text-[#9096b0]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          <FilterPill label="Todos" active={filterTipo === 'all'} onClick={() => { setFilterTipo('all'); resetPage(); }} />
          <FilterPill label="Ingresos" active={filterTipo === 'Ingreso'} onClick={() => { setFilterTipo('Ingreso'); resetPage(); }} />
          <FilterPill label="Gastos" active={filterTipo === 'Gasto'} onClick={() => { setFilterTipo('Gasto'); resetPage(); }} />

          {allCategories.length > 1 && (
            <>
              <span className="text-[#5a5f75] text-xs self-center">|</span>
              <FilterPill label="Categorías: todas" active={filterCat === 'all'} onClick={() => { setFilterCat('all'); resetPage(); }} />
              {allCategories.map((cat) => (
                <FilterPill
                  key={cat}
                  label={cat}
                  active={filterCat === cat}
                  onClick={() => { setFilterCat(cat === filterCat ? 'all' : cat); resetPage(); }}
                />
              ))}
            </>
          )}

          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setFilterTipo('all'); setFilterCat('all'); resetPage(); }}
              className="text-xs text-[#5a5f75] hover:text-[#9096b0] underline underline-offset-2 ml-1"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Table body */}
      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#5a5f75] animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(240,236,228,0.02)] border border-[rgba(240,236,228,0.05)] flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-[#5a5f75] opacity-50" />
          </div>
          <p className="text-sm">
            {hasActiveFilters ? 'Sin resultados para los filtros aplicados' : 'Sin transacciones en este período'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(240,236,228,0.05)]">
                {['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Importe', ''].map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-left section-label ${h === 'Importe' ? 'text-right' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-[rgba(240,236,228,0.04)] hover:bg-[rgba(240,236,228,0.02)] transition-colors group"
                >
                  <td className="px-5 py-3.5 text-[#9096b0] whitespace-nowrap text-xs">
                    {formatDate(tx.fecha)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <TypeBadge tipo={tx.tipo} />
                  </td>
                  <td className="px-5 py-3.5 text-[#9096b0] whitespace-nowrap text-xs">
                    {tx.categoria}
                  </td>
                  <td className="px-5 py-3.5 text-[#c8c4bc] max-w-[200px] truncate text-xs">
                    {tx.concepto}
                  </td>
                  <td
                    className={`px-5 py-3.5 text-right font-editorial whitespace-nowrap tabular-nums text-base ${
                      tx.tipo === 'Ingreso' ? 'text-[#7db88f]' : 'text-[#c49090]'
                    }`}
                  >
                    {tx.tipo === 'Ingreso' ? '+' : '−'}
                    {formatEur(tx.importe)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <DeleteButton id={tx.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(240,236,228,0.07)]">
          <p className="text-xs text-[#5a5f75]">
            Página {safePage + 1} de {totalPages} · {filtered.length} transacciones
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="p-1.5 rounded-lg text-[#9096b0] hover:text-[#f0ece4] hover:bg-[rgba(240,236,228,0.05)] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(0, Math.min(safePage - 2, totalPages - 5)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={[
                    'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                    p === safePage
                      ? 'bg-[rgba(155,142,196,0.2)] text-[#c4b8e8]'
                      : 'text-[#9096b0] hover:text-[#f0ece4] hover:bg-[rgba(240,236,228,0.05)]',
                  ].join(' ')}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="p-1.5 rounded-lg text-[#9096b0] hover:text-[#f0ece4] hover:bg-[rgba(240,236,228,0.05)] disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
