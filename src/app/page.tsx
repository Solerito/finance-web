import { Suspense } from 'react';
import { LayoutDashboard, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import {
  getTransactions,
  getKpis,
  getMonthlyProfits,
  getCategoryExpenses,
} from '@/actions/transactions';

import { TransactionForm } from '@/components/forms/TransactionForm';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { BarChartWidget } from '@/components/dashboard/BarChartWidget';
import { PieChartWidget } from '@/components/dashboard/PieChartWidget';
import { TransactionTable } from '@/components/dashboard/TransactionTable';

// ─── Skeleton placeholders ────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 h-28 animate-pulse" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-[340px] animate-pulse" />
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-64 animate-pulse" />
  );
}

// ─── Async data sections ──────────────────────────────────────────────────

async function KpiSection({ year, month }: { year: number; month: number }) {
  const kpis = await getKpis(year, month);
  const monthLabel = format(new Date(year, month - 1), 'MMMM yyyy', { locale: es });
  return <KpiCards kpis={kpis} monthLabel={monthLabel} />;
}

async function ChartsSection({ year, month }: { year: number; month: number }) {
  const [monthlyProfits, categoryExpenses] = await Promise.all([
    getMonthlyProfits(year),
    getCategoryExpenses(year, month),
  ]);
  const monthLabel = format(new Date(year, month - 1), 'MMMM yyyy', { locale: es });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BarChartWidget data={monthlyProfits} year={year} />
      <PieChartWidget data={categoryExpenses} monthLabel={monthLabel} />
    </div>
  );
}

async function TableSection() {
  const transactions = await getTransactions(100);
  return <TransactionTable transactions={transactions} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Header ── */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
            <LayoutDashboard className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Gestor Financiero
          </h1>
        </div>
        <p className="text-slate-500 text-sm ml-[52px] flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          Dashboard · {format(now, "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
      </header>

      {/* ── Layout: Form (left) | Dashboard (right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">
        {/* Sticky form */}
        <aside className="xl:self-start xl:sticky xl:top-6">
          <TransactionForm />
        </aside>

        {/* Main dashboard content */}
        <div className="space-y-6">
          {/* KPI cards */}
          <Suspense fallback={<KpiSkeleton />}>
            <KpiSection year={year} month={month} />
          </Suspense>

          {/* Charts */}
          <Suspense
            fallback={
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            }
          >
            <ChartsSection year={year} month={month} />
          </Suspense>

          {/* Transactions table */}
          <Suspense fallback={<TableSkeleton />}>
            <TableSection />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
