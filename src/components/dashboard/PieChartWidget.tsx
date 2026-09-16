'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipContentProps,
  type TooltipValueType,
} from 'recharts';
import { type NameType } from 'recharts/types/component/DefaultTooltipContent';
import { type LegendPayload } from 'recharts/types/component/DefaultLegendContent';
import { type CategoryExpense } from '@/lib/types';
import { PieChart as PieIcon } from 'lucide-react';

// ─── Colour palette ───────────────────────────────────────────────────────

const COLOURS = [
  '#818cf8', '#f87171', '#34d399', '#fbbf24',
  '#60a5fa', '#f472b6', '#a78bfa', '#2dd4bf',
  '#fb923c', '#4ade80',
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: TooltipContentProps<TooltipValueType, NameType>) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const name = String(entry.name ?? '');
  const value = Number(entry.value ?? 0);

  const fmt = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl p-3 shadow-2xl text-sm">
      <p className="font-semibold text-white">{name}</p>
      <p className="text-slate-300">{fmt(value)}</p>
    </div>
  );
}

// ─── Custom Legend ────────────────────────────────────────────────────────

function CustomLegend({ payload }: { payload?: readonly LegendPayload[] }) {
  if (!payload) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          {String(entry.value ?? '')}
        </li>
      ))}
    </ul>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

interface PieChartWidgetProps {
  data: CategoryExpense[];
  monthLabel: string;
}

export function PieChartWidget({ data, monthLabel }: PieChartWidgetProps) {
  const hasData = data.length > 0;

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl">
      <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
        <PieIcon className="w-4 h-4 text-rose-400" />
        Gastos por Categoría
      </h3>
      <p className="text-slate-500 text-xs mb-5">{monthLabel}</p>

      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="categoria"
              cx="50%"
              cy="45%"
              outerRadius={90}
              innerRadius={46}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLOURS[index % COLOURS.length]} />
              ))}
            </Pie>
            <Tooltip content={CustomTooltip} />
            <Legend content={CustomLegend} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[260px]">
          <div className="text-center">
            <div className="text-4xl mb-3">🍩</div>
            <p className="text-slate-500 text-sm">Sin gastos este mes</p>
          </div>
        </div>
      )}
    </div>
  );
}
