import { Suspense } from 'react';

// Fuerza SSR puro: Next.js no pre-renderiza esta página en build time.
// Necesario porque accede a SQLite, que solo existe en runtime (volumen Docker).
export const dynamic = 'force-dynamic';
import { History } from 'lucide-react';
import { searchTransactions, getHistoryCategories, type HistoryFilters } from './actions';
import { HistoryFilters as HistoryFiltersBar } from '@/components/history/HistoryFilters';
import { HistoryTable } from '@/components/history/HistoryTable';
import { HistoryPagination } from '@/components/history/HistoryPagination';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFilters(sp: Record<string, string | string[] | undefined>): HistoryFilters {
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) as string | undefined;

  const importeMin = parseFloat(get('minE') ?? '');
  const importeMax = parseFloat(get('maxE') ?? '');

  return {
    query:      get('q') || undefined,
    tipo:       (get('tipo') as HistoryFilters['tipo']) ?? 'all',
    categoria:  get('cat') ?? 'all',
    from:       get('from') || undefined,
    to:         get('to')   || undefined,
    importeMin: isNaN(importeMin) ? undefined : importeMin,
    importeMax: isNaN(importeMax) ? undefined : importeMax,
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card animate-pulse" style={{ height: 120 + i * 40 }} />
      ))}
    </div>
  );
}

// ─── Async content ────────────────────────────────────────────────────────────

async function HistoryContent({
  filters,
  page,
}: {
  filters: HistoryFilters;
  page: number;
}) {
  const [result, categories, totalResult] = await Promise.all([
    searchTransactions(filters, page, 50),
    getHistoryCategories(),
    // Get total count without filters for the "N de M" display
    searchTransactions({}, 0, 1),
  ]);

  return (
    <div className="space-y-4">
      <HistoryFiltersBar
        categories={categories}
        filters={filters}
        total={totalResult.total}
        filtered={result.total}
      />
      <HistoryTable transactions={result.rows} />
      <HistoryPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HistoryPage(props: PageProps<'/history'>) {
  const sp = await props.searchParams;

  const filters = parseFilters(sp as Record<string, string | undefined>);
  const page    = Math.max(0, parseInt((sp['page'] as string) ?? '0', 10) || 0);

  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <header className="mb-6">
        <h1 className="font-editorial text-xl text-[#f0ece4] tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-[#6b8cae]" />
          Historial
        </h1>
        <p className="text-[#5a5f75] text-xs mt-0.5">
          Todas tus transacciones — búsqueda, filtros y exportación
        </p>
      </header>

      <Suspense fallback={<HistorySkeleton />}>
        <HistoryContent filters={filters} page={page} />
      </Suspense>
    </main>
  );
}
