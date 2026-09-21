import { Suspense } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { getBudgetsWithProgress } from './actions';
import { getAllCategories } from '@/actions/categories';
import { BUILTIN_CATEGORIES } from '@/lib/types';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetForm } from '@/components/budgets/BudgetForm';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="card p-4 flex items-center gap-3"
      style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
    >
      <span style={{ color }} className="opacity-80">{icon}</span>
      <div>
        <p className="section-label">{label}</p>
        <p className="font-editorial text-xl text-[#f0ece4] tabular-nums">{value}</p>
      </div>
    </div>
  );
}

// ─── Main budgets content ─────────────────────────────────────────────────────

async function BudgetsContent({ categorias }: { categorias: string[] }) {
  const budgets = await getBudgetsWithProgress();

  if (budgets.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(155,142,196,0.1)] border border-[rgba(155,142,196,0.2)] flex items-center justify-center">
          <PiggyBank className="w-7 h-7 text-[#9b8ec4]" />
        </div>
        <div>
          <p className="text-[#f0ece4] font-medium mb-1">Sin presupuestos</p>
          <p className="text-[#5a5f75] text-sm max-w-xs">
            Usa el formulario para definir límites de gasto mensuales por categoría.
          </p>
        </div>
      </div>
    );
  }

  const activeBudgets = budgets.filter((b) => b.activo === 1);
  const totalLimite  = activeBudgets.reduce((s, b) => s + b.limite_mensual, 0);
  const totalGastado = activeBudgets.reduce((s, b) => s + b.gastado, 0);
  const totalRestante = totalLimite - totalGastado;
  const pctTotal = totalLimite > 0 ? (totalGastado / totalLimite) * 100 : 0;

  // Sort: over budget first, then by % desc
  const sorted = [...budgets].sort((a, b) => b.porcentaje - a.porcentaje);

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          label="Presupuestado (mes)"
          value={formatEur(totalLimite)}
          icon={<Wallet className="w-5 h-5" />}
          color="#9b8ec4"
        />
        <SummaryCard
          label="Gastado"
          value={formatEur(totalGastado)}
          icon={<TrendingDown className="w-5 h-5" />}
          color={pctTotal >= 100 ? '#b08080' : pctTotal >= 80 ? '#c9a96e' : '#7db88f'}
        />
        <SummaryCard
          label="Restante"
          value={formatEur(Math.max(0, totalRestante))}
          icon={<TrendingUp className="w-5 h-5" />}
          color={totalRestante >= 0 ? '#7db88f' : '#b08080'}
        />
      </div>

      {/* Global progress bar */}
      <div className="card px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-[#9096b0]">Progreso global del mes</p>
          <p className="text-xs font-medium tabular-nums" style={{
            color: pctTotal >= 100 ? '#b08080' : pctTotal >= 80 ? '#c9a96e' : '#7db88f',
          }}>
            {pctTotal.toFixed(1)}%
          </p>
        </div>
        <div className="h-2.5 rounded-full bg-[rgba(240,236,228,0.06)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(pctTotal, 100)}%`,
              background: pctTotal >= 100 ? '#b08080' : pctTotal >= 80 ? '#c9a96e' : '#7db88f',
            }}
          />
        </div>
        <p className="text-[11px] text-[#5a5f75] mt-2 capitalize">
          {format(new Date(), "MMMM yyyy", { locale: es })} · {budgets.length} categorías activas
        </p>
      </div>

      {/* Budget cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((b, i) => (
          <div key={b.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <BudgetCard budget={b} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BudgetsPage() {
  const { builtin, custom } = await getAllCategories();
  const allCats = [...BUILTIN_CATEGORIES, ...custom].filter(
    (c) => c !== 'Ingresos' && c !== 'Otro',
  );

  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <header className="mb-6">
        <h1 className="font-editorial text-xl text-[#f0ece4] tracking-tight">Presupuestos</h1>
        <p className="text-[#5a5f75] text-xs mt-0.5 capitalize">
          {format(new Date(), "MMMM yyyy", { locale: es })} · Límites de gasto por categoría
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5">
        {/* Form sidebar */}
        <aside className="xl:self-start xl:sticky xl:top-6">
          <BudgetForm categorias={allCats} />
        </aside>

        {/* Budget cards */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-44 animate-pulse" />
              ))}
            </div>
          }
        >
          <BudgetsContent categorias={allCats} />
        </Suspense>
      </div>
    </main>
  );
}
