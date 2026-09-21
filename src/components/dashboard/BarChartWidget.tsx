'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipContentProps,
  type TooltipValueType,
} from 'recharts';
import { type NameType } from 'recharts/types/component/DefaultTooltipContent';
import { type MonthlyProfit } from '@/lib/types';
import { BarChart2 } from 'lucide-react';

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipContentProps<TooltipValueType, NameType>) {
  if (!active || !payload?.length) return null;

  const fmt = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div className="card px-4 py-3 text-sm min-w-[170px]">
      <p className="font-medium text-[#f0ece4] mb-2">{String(label ?? '')}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex justify-between gap-4 leading-6">
          <span style={{ color: entry.color as string }} className="opacity-80">{String(entry.name ?? '')}</span>
          <span className="font-editorial text-[#f0ece4]">{fmt(Number(entry.value ?? 0))}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BarChartWidgetProps {
  data: MonthlyProfit[];
  periodLabel: string;
}

export function BarChartWidget({ data, periodLabel }: BarChartWidgetProps) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#f0ece4] flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#9b8ec4]" />
          Ingresos vs. Gastos
        </h3>
        <p className="section-label mt-1">{periodLabel}</p>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,236,228,0.05)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fill: '#5a5f75', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#5a5f75', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}€`}
            width={42}
          />
          <Tooltip content={CustomTooltip} cursor={{ fill: 'rgba(240,236,228,0.03)' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: '14px', color: '#9096b0' }}
          />
          <Bar dataKey="ingresos" name="Ingresos" fill="#7db88f" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="gastos"   name="Gastos"   fill="#b08080" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
