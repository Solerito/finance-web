'use client';

import {
  LineChart,
  Line,
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
import { type CategoryTrend } from '@/lib/types';
import { Activity } from 'lucide-react';

// ─── Palette ──────────────────────────────────────────────────────────────────

const COLOURS = ['#9b8ec4', '#6b8cae', '#7db88f', '#c9a96e', '#b08080'];

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipContentProps<TooltipValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const fmt = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div className="card px-4 py-3 text-sm min-w-[180px]">
      <p className="section-label mb-2">{String(label ?? '')}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex justify-between gap-4 leading-6">
          <span style={{ color: entry.color as string }}>{String(entry.name ?? '')}</span>
          <span className="font-editorial text-[#f0ece4]">{fmt(Number(entry.value ?? 0))}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CategoryTrendChartProps {
  data: CategoryTrend[];
  categories: string[];
  periodLabel: string;
}

export function CategoryTrendChart({ data, categories, periodLabel }: CategoryTrendChartProps) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#f0ece4] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#6b8cae]" />
          Evolución por Categoría
        </h3>
        <p className="section-label mt-1">{periodLabel} · Top {categories.length} categorías</p>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[220px]">
          <p className="text-[#5a5f75] text-sm">Sin datos en este período</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,236,228,0.05)" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fill: '#5a5f75', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#5a5f75', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}€`}
              width={42}
            />
            <Tooltip content={CustomTooltip} cursor={{ stroke: 'rgba(240,236,228,0.08)', strokeWidth: 1 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: '12px', color: '#9096b0' }} />
            {categories.map((cat, i) => (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                name={cat}
                stroke={COLOURS[i % COLOURS.length]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
