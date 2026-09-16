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

// ─── Custom Tooltip ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipContentProps<TooltipValueType, NameType>) {
  if (!active || !payload?.length) return null;

  const fmt = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl p-3 shadow-2xl text-sm min-w-[160px]">
      <p className="font-semibold text-slate-200 mb-2">{String(label ?? '')}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex justify-between gap-4">
          <span style={{ color: entry.color as string }}>{String(entry.name ?? '')}</span>
          <span className="font-medium text-white">{fmt(Number(entry.value ?? 0))}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

interface BarChartWidgetProps {
  data: MonthlyProfit[];
  year: number;
}

export function BarChartWidget({ data, year }: BarChartWidgetProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
      <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-indigo-400" />
        Beneficio por Mes — {year}
      </h3>
      <p className="text-slate-500 text-xs mb-5">Comparativa ingresos vs gastos</p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}€`}
            width={46}
          />
          <Tooltip content={CustomTooltip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: '12px', color: '#94a3b8' }} />
          <Bar dataKey="ingresos" name="Ingresos" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="gastos" name="Gastos" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
