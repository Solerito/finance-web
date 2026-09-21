import { type Transaction } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Flame, Star } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEur(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), 'dd MMM', { locale: es });
  } catch {
    return iso.slice(0, 10);
  }
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function TopRow({
  tx,
  rank,
  tipo,
}: {
  tx: Transaction;
  rank: number;
  tipo: 'gasto' | 'ingreso';
}) {
  const isGasto = tipo === 'gasto';
  const color = isGasto ? '#c49090' : '#7db88f';
  const bgColor = isGasto ? 'rgba(176,128,128,0.06)' : 'rgba(125,184,143,0.06)';

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:brightness-110"
      style={{ background: rank === 1 ? bgColor : 'transparent' }}
    >
      <span
        className="text-[11px] font-bold w-5 text-center tabular-nums shrink-0"
        style={{ color: rank === 1 ? color : '#5a5f75' }}
      >
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#c8c4bc] truncate">{tx.concepto}</p>
        <p className="text-[11px] text-[#5a5f75]">
          {tx.categoria} · {formatDate(tx.fecha)}
        </p>
      </div>
      <span
        className="text-sm font-editorial font-medium tabular-nums shrink-0"
        style={{ color }}
      >
        {isGasto ? '−' : '+'}{formatEur(tx.importe)}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TopTransactionsProps {
  topGastos: Transaction[];
  topIngresos: Transaction[];
}

export function TopTransactions({ topGastos, topIngresos }: TopTransactionsProps) {
  const hasData = topGastos.length > 0 || topIngresos.length > 0;

  if (!hasData) {
    return (
      <div className="card p-5 flex flex-col items-center justify-center py-10 text-[#5a5f75] text-sm">
        Sin transacciones destacadas en este período
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Top Gastos */}
      {topGastos.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-[#b08080]" />
            <h3 className="text-sm font-semibold text-[#f0ece4]">Mayores Gastos</h3>
          </div>
          <div className="space-y-0.5">
            {topGastos.map((tx, i) => (
              <TopRow key={tx.id} tx={tx} rank={i + 1} tipo="gasto" />
            ))}
          </div>
        </div>
      )}

      {/* Top Ingresos */}
      {topIngresos.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-[#7db88f]" />
            <h3 className="text-sm font-semibold text-[#f0ece4]">Mayores Ingresos</h3>
          </div>
          <div className="space-y-0.5">
            {topIngresos.map((tx, i) => (
              <TopRow key={tx.id} tx={tx} rank={i + 1} tipo="ingreso" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
