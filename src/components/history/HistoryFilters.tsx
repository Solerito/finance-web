'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Search, X, SlidersHorizontal, Download } from 'lucide-react';
import { exportTransactionsCsv, type HistoryFilters } from '@/app/history/actions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
        'px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap',
        active
          ? 'bg-[rgba(155,142,196,0.15)] border-[rgba(155,142,196,0.4)] text-[#c4b8e8]'
          : 'bg-transparent border-[rgba(240,236,228,0.1)] text-[#9096b0] hover:border-[rgba(240,236,228,0.2)] hover:text-[#f0ece4]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

// ─── Export Button ────────────────────────────────────────────────────────────

function ExportButton({ filters }: { filters: HistoryFilters }) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const csv = await exportTransactionsCsv(filters);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transacciones-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[rgba(240,236,228,0.15)] text-[#9096b0] hover:text-[#f0ece4] hover:border-[rgba(240,236,228,0.3)] hover:bg-[rgba(240,236,228,0.05)] disabled:opacity-50 transition-all"
    >
      <Download className="w-3.5 h-3.5" />
      {isPending ? 'Exportando…' : 'Exportar CSV'}
    </button>
  );
}

// ─── HistoryFilters component ─────────────────────────────────────────────────

interface HistoryFiltersProps {
  categories: string[];
  filters: HistoryFilters;
  total: number;
  filtered: number;
}

export function HistoryFilters({ categories, filters, total, filtered }: HistoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const push = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === undefined || value === '' || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      // Reset to page 0 on filter change
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const hasFilters =
    filters.query || filters.tipo !== 'all' || filters.categoria !== 'all' ||
    filters.importeMin !== undefined || filters.importeMax !== undefined ||
    filters.from || filters.to;

  return (
    <div className="card p-4 space-y-3">
      {/* Top row: search + export */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5a5f75]" />
          <input
            type="text"
            placeholder="Buscar por concepto o categoría…"
            defaultValue={filters.query ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') push('q', (e.target as HTMLInputElement).value);
            }}
            onChange={(e) => {
              if (e.target.value === '') push('q', undefined);
            }}
            className="input-paper w-full pl-8 pr-8 py-1.5 text-xs"
          />
          {filters.query && (
            <button
              onClick={() => push('q', undefined)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a5f75] hover:text-[#9096b0]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <ExportButton filters={filters} />
        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="text-xs text-[#5a5f75] hover:text-[#9096b0] underline underline-offset-2 whitespace-nowrap"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Tipo pills */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <SlidersHorizontal className="w-3.5 h-3.5 text-[#5a5f75] shrink-0" />
        {(['all', 'Ingreso', 'Gasto'] as const).map((t) => (
          <FilterPill
            key={t}
            label={t === 'all' ? 'Todo' : t === 'Ingreso' ? '↑ Ingresos' : '↓ Gastos'}
            active={(filters.tipo ?? 'all') === t}
            onClick={() => push('tipo', t === 'all' ? undefined : t)}
          />
        ))}
        <span className="text-[#5a5f75] text-xs px-1">|</span>
        {categories.map((cat) => (
          <FilterPill
            key={cat}
            label={cat}
            active={filters.categoria === cat}
            onClick={() => push('cat', cat === filters.categoria ? undefined : cat)}
          />
        ))}
      </div>

      {/* Date + amount range */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[11px] text-[#5a5f75] font-medium">Fecha:</span>
        <input
          type="date"
          defaultValue={filters.from ?? ''}
          onChange={(e) => push('from', e.target.value || undefined)}
          className="input-paper py-1 text-xs w-36"
        />
        <span className="text-[#5a5f75] text-xs">→</span>
        <input
          type="date"
          defaultValue={filters.to ?? ''}
          onChange={(e) => push('to', e.target.value || undefined)}
          className="input-paper py-1 text-xs w-36"
        />
        <span className="text-[11px] text-[#5a5f75] font-medium ml-3">Importe:</span>
        <input
          type="number"
          placeholder="Min €"
          min="0" step="0.01"
          defaultValue={filters.importeMin ?? ''}
          onChange={(e) => push('minE', e.target.value || undefined)}
          className="input-paper py-1 text-xs w-24 text-right"
        />
        <span className="text-[#5a5f75] text-xs">—</span>
        <input
          type="number"
          placeholder="Max €"
          min="0" step="0.01"
          defaultValue={filters.importeMax ?? ''}
          onChange={(e) => push('maxE', e.target.value || undefined)}
          className="input-paper py-1 text-xs w-24 text-right"
        />
      </div>

      {/* Result count */}
      <p className="text-[11px] text-[#5a5f75]">
        {filtered.toLocaleString('es-ES')} transacciones
        {hasFilters && ` de ${total.toLocaleString('es-ES')} total`}
      </p>
    </div>
  );
}
