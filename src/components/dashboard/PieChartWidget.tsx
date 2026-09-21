'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
  type TooltipValueType,
} from 'recharts';
import { type NameType } from 'recharts/types/component/DefaultTooltipContent';
import { type CategoryExpense } from '@/lib/types';
import { PieChart as PieIcon } from 'lucide-react';

// ─── Colour palette — Paper Dark ─────────────────────────────────────────────

const COLOURS = [
  '#9b8ec4', '#6b8cae', '#7db88f', '#c9a96e',
  '#b08080', '#8eaac4', '#a4c48e', '#c4ae8e',
  '#8e9bc4', '#c48eae',
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: TooltipContentProps<TooltipValueType, NameType>) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const name = String(entry.name ?? '');
  const value = Number(entry.value ?? 0);
  const fmt = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div className="card px-4 py-3 text-sm">
      <p className="font-medium text-[#f0ece4]">{name}</p>
      <p className="font-editorial text-lg" style={{ color: entry.payload?.fill ?? '#9b8ec4' }}>
        {fmt(value)}
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PieChartWidgetProps {
  data: CategoryExpense[];
  periodLabel: string;
}

export function PieChartWidget({ data, periodLabel }: PieChartWidgetProps) {
  const hasData = data.length > 0;
  const total = data.reduce((s, d) => s + d.total, 0);

  const fmt = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#f0ece4] flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-[#b08080]" />
          Gastos por Categoría
        </h3>
        <p className="section-label mt-1">{periodLabel}</p>
      </div>

      {hasData ? (
        <div className="flex gap-4 items-start">
          {/* Donut */}
          <div className="flex-shrink-0 w-[140px] h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={36}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={COLOURS[index % COLOURS.length]} />
                  ))}
                </Pie>
                <Tooltip content={CustomTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category list with progress bars */}
          <div className="flex-1 space-y-2.5 min-w-0 pt-1">
            {data.slice(0, 6).map((item, i) => {
              const pct = total > 0 ? (item.total / total) * 100 : 0;
              const color = COLOURS[i % COLOURS.length];
              return (
                <div key={item.categoria}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#9096b0] truncate max-w-[100px]">{item.categoria}</span>
                    <span className="font-editorial text-[#f0ece4] ml-2 flex-shrink-0">{fmt(item.total)}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(240,236,228,0.07)' }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[150px]">
          <div className="text-center">
            <div className="text-3xl mb-2 opacity-30">○</div>
            <p className="text-[#5a5f75] text-sm">Sin gastos en este período</p>
          </div>
        </div>
      )}
    </div>
  );
}
