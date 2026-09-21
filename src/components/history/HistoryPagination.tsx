'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface HistoryPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export function HistoryPagination({ page, totalPages, total, pageSize }: HistoryPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  const from = page * pageSize + 1;
  const to   = Math.min((page + 1) * pageSize, total);

  // Page window: show 5 buttons centered on current page
  const windowSize = 5;
  const windowStart = Math.max(0, Math.min(page - 2, totalPages - windowSize));
  const pageNumbers = Array.from(
    { length: Math.min(windowSize, totalPages) },
    (_, i) => windowStart + i,
  );

  return (
    <div className="card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
      <p className="text-xs text-[#5a5f75] tabular-nums">
        {from.toLocaleString('es-ES')}–{to.toLocaleString('es-ES')} de {total.toLocaleString('es-ES')} transacciones
      </p>

      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => goTo(0)} disabled={page === 0}
          className="p-1.5 rounded-lg text-[#9096b0] hover:text-[#f0ece4] hover:bg-[rgba(240,236,228,0.05)] disabled:opacity-30 transition-colors"
          title="Primera página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        {/* Prev */}
        <button
          onClick={() => goTo(page - 1)} disabled={page === 0}
          className="p-1.5 rounded-lg text-[#9096b0] hover:text-[#f0ece4] hover:bg-[rgba(240,236,228,0.05)] disabled:opacity-30 transition-colors"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => goTo(p)}
            className={[
              'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
              p === page
                ? 'bg-[rgba(155,142,196,0.2)] text-[#c4b8e8]'
                : 'text-[#9096b0] hover:text-[#f0ece4] hover:bg-[rgba(240,236,228,0.05)]',
            ].join(' ')}
          >
            {p + 1}
          </button>
        ))}

        {/* Next */}
        <button
          onClick={() => goTo(page + 1)} disabled={page >= totalPages - 1}
          className="p-1.5 rounded-lg text-[#9096b0] hover:text-[#f0ece4] hover:bg-[rgba(240,236,228,0.05)] disabled:opacity-30 transition-colors"
          title="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {/* Last */}
        <button
          onClick={() => goTo(totalPages - 1)} disabled={page >= totalPages - 1}
          className="p-1.5 rounded-lg text-[#9096b0] hover:text-[#f0ece4] hover:bg-[rgba(240,236,228,0.05)] disabled:opacity-30 transition-colors"
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-[#5a5f75]">
        Página {page + 1} de {totalPages}
      </p>
    </div>
  );
}
