import { Suspense } from 'react';

// Fuerza SSR puro: Next.js no pre-renderiza esta página en build time.
// Necesario porque accede a SQLite, que solo existe en runtime (volumen Docker).
export const dynamic = 'force-dynamic';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';

import {
  getKpisForRange,
  getMonthlyProfitsForRange,
  getCategoryExpensesForRange,
  getDailyBalances,
  getCategoryTrends,
  getTransactions,
  getKpisComparison,
  getHeatmapData,
  getTopTransactions,
} from '@/actions/transactions';
import { getAllCategories } from '@/actions/categories';
import { presetToRange, type TimePeriodPreset, type DateRange } from '@/lib/types';

import { TransactionForm } from '@/components/forms/TransactionForm';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { BarChartWidget } from '@/components/dashboard/BarChartWidget';
import { PieChartWidget } from '@/components/dashboard/PieChartWidget';
import { AreaChartWidget } from '@/components/dashboard/AreaChartWidget';
import { CategoryTrendChart } from '@/components/dashboard/CategoryTrendChart';
import { SavingsRateWidget } from '@/components/dashboard/SavingsRateWidget';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { TimeRangePicker } from '@/components/dashboard/TimeRangePicker';
import { SpendingHeatmap } from '@/components/dashboard/SpendingHeatmap';
import { TopTransactions } from '@/components/dashboard/TopTransactions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveRange(
  period: string | undefined,
  from: string | undefined,
  to: string | undefined,
): DateRange {
  if (period === 'custom' && from && to) {
    return { from, to };
  }
  const validPresets: TimePeriodPreset[] = ['1M', '3M', '6M', '1Y', 'YTD'];
  const preset = validPresets.includes(period as TimePeriodPreset)
    ? (period as TimePeriodPreset)
    : '1M';
  return presetToRange(preset);
}

function periodDisplayLabel(range: DateRange): string {
  const opts = { locale: es };
  const f = format(new Date(range.from), 'd MMM yyyy', opts);
  const t = format(new Date(range.to), 'd MMM yyyy', opts);
  return `${f} — ${t}`;
}

// ─── Skeleton placeholders ────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card h-[108px] animate-pulse" />
      ))}
    </div>
  );
}

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <div className="card animate-pulse" style={{ height }} />;
}

// ─── Async sections ───────────────────────────────────────────────────────────

async function KpiSection({ range }: { range: DateRange }) {
  const [kpis, comparison] = await Promise.all([
    getKpisForRange(range),
    getKpisComparison(range),
  ]);
  return (
    <KpiCards
      kpis={kpis}
      periodLabel={periodDisplayLabel(range)}
      comparison={comparison}
    />
  );
}

async function ChartsSection({ range }: { range: DateRange }) {
  const label = periodDisplayLabel(range);
  const [monthlyProfits, categoryExpenses, dailyBalances, categoryTrends] = await Promise.all([
    getMonthlyProfitsForRange(range),
    getCategoryExpensesForRange(range),
    getDailyBalances(range),
    getCategoryTrends(range),
  ]);

  const topCategories = categoryTrends.length > 0
    ? Object.keys(categoryTrends[0]).filter((k) => k !== 'mes')
    : [];

  const kpis = await getKpisForRange(range);

  return (
    <div className="space-y-4">
      {/* Row 1: Bar + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartWidget data={monthlyProfits} periodLabel={label} />
        <PieChartWidget data={categoryExpenses} periodLabel={label} />
      </div>

      {/* Row 2: Area + Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <AreaChartWidget data={dailyBalances} periodLabel={label} />
        <SavingsRateWidget
          rate={kpis.tasaAhorro}
          totalIngresos={kpis.totalIngresos}
          totalGastos={kpis.totalGastos}
          periodLabel={label}
        />
      </div>

      {/* Row 3: Category trends (full width) */}
      {topCategories.length > 0 && (
        <CategoryTrendChart
          data={categoryTrends}
          categories={topCategories}
          periodLabel={label}
        />
      )}
    </div>
  );
}

async function HeatmapSection({ range }: { range: DateRange }) {
  const data = await getHeatmapData(range);
  return <SpendingHeatmap data={data} from={range.from} to={range.to} />;
}

async function TopSection({ range }: { range: DateRange }) {
  const { top_gastos, top_ingresos } = await getTopTransactions(range, 5);
  return <TopTransactions topGastos={top_gastos} topIngresos={top_ingresos} />;
}

async function TableSection({ range }: { range: DateRange }) {
  const transactions = await getTransactions(500, range);
  return <TransactionTable transactions={transactions} periodLabel={periodDisplayLabel(range)} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage(props: PageProps<'/'>) {
  const sp = await props.searchParams;
  const period = sp['period'] as string | undefined;
  const from   = sp['from']   as string | undefined;
  const to     = sp['to']     as string | undefined;

  const range = resolveRange(period, from, to);
  const now = new Date();
  const { custom: customCategories } = await getAllCategories();

  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      {/* ── Page header ── */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-editorial text-xl text-[#f0ece4] tracking-tight">
            Dashboard
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <CalendarDays className="w-3.5 h-3.5 text-[#5a5f75]" />
            <p className="text-[#5a5f75] text-xs capitalize">
              {format(now, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
      </header>

      {/* ── Layout: Form (left) | Dashboard (right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5">
        {/* Sticky form */}
        <aside className="xl:self-start xl:sticky xl:top-6 space-y-5">
          <TransactionForm initialCustomCategories={customCategories} />
        </aside>

        {/* Main dashboard */}
        <div className="space-y-5 min-w-0">
          {/* Time range picker */}
          <div className="card px-4 py-3">
            <Suspense fallback={<div className="h-8 animate-pulse" />}>
              <TimeRangePicker />
            </Suspense>
          </div>

          {/* KPI cards */}
          <Suspense fallback={<KpiSkeleton />}>
            <KpiSection range={range} />
          </Suspense>

          {/* Charts */}
          <Suspense
            fallback={
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ChartSkeleton />
                  <ChartSkeleton />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
                  <ChartSkeleton />
                  <ChartSkeleton height={200} />
                </div>
                <ChartSkeleton />
              </div>
            }
          >
            <ChartsSection range={range} />
          </Suspense>

          {/* Heatmap + Top Transactions side by side on wide screens */}
          <Suspense
            fallback={
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartSkeleton height={160} />
                <ChartSkeleton height={160} />
              </div>
            }
          >
            <div className="grid grid-cols-1 gap-4">
              <HeatmapSection range={range} />
              <TopSection range={range} />
            </div>
          </Suspense>

          {/* Transactions table */}
          <Suspense fallback={<ChartSkeleton height={200} />}>
            <TableSection range={range} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
