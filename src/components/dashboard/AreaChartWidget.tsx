'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
  type TooltipValueType,
} from 'recharts';
import { type NameType } from 'recharts/types/component/DefaultTooltipContent';
import { type DailyBalance } from '@/lib/types';
import { TrendingUp } from 'lucide-react';

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipContentProps<TooltipValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const fmt = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);

  const acumulado = payload.find((p) => p.dataKey === 'acumulado');
  const ingresos  = payload.find((p) => p.dataKey === 'ingresos');
  const gastos    = payload.find((p) => p.dataKey === 'gastos');

  return (
    <div className="card px-4 py-3 text-sm min-w-[190px]">
      <p className="section-label mb-2">{String(label ?? '')}</p>
      {acumulado && (
        <p className="font-editorial text-base text-[#9b8ec4]">
          {fmt(Number(acumulado.value ?? 0))} acumulado
        </p>
      )}
      <div className="mt-2 space-y-1">
        {ingresos && (
          <div className="flex justify-between">
            <span className="text-[#7db88f]">Ingresos</span>
            <span className="text-[#f0ece4]">{fmt(Number(ingresos.value ?? 0))}</span>
          </div>
        )}
        {gastos && (
          <div className="flex justify-between">
            <span className="text-[#b08080]">Gastos</span>
            <span className="text-[#f0ece4]">{fmt(Number(gastos.value ?? 0))}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AreaChartWidgetProps {
  data: DailyBalance[];
  periodLabel: string;
}

export function AreaChartWidget({ data, periodLabel }: AreaChartWidgetProps) {
  const lastBalance = data.length > 0 ? data[data.length - 1].acumulado : 0;
  const fmt = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);

  // Shorten dates for X axis
  const tickData = data.filter((_, i) => {
    if (data.length <= 10) return true;
    return i % Math.ceil(data.length / 8) === 0 || i === data.length - 1;
  });
  const tickSet = new Set(tickData.map((d) => d.fecha));

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#f0ece4] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#9b8ec4]" />
            Balance Acumulado
          </h3>
          <p className="section-label mt-1">{periodLabel}</p>
        </div>
        <div className="text-right">
          <p className="font-editorial text-lg" style={{ color: lastBalance >= 0 ? '#9b8ec4' : '#b08080' }}>
            {fmt(lastBalance)}
          </p>
          <p className="text-xs text-[#5a5f75]">balance final</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[220px]">
          <p className="text-[#5a5f75] text-sm">Sin datos en este período</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradAcumulado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#9b8ec4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#9b8ec4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7db88f" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7db88f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,236,228,0.05)" vertical={false} />
            <XAxis
              dataKey="fecha"
              tick={{ fill: '#5a5f75', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => v.slice(5)} // MM-DD
              interval="preserveStartEnd"
              ticks={[...tickSet]}
            />
            <YAxis
              tick={{ fill: '#5a5f75', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}€`}
              width={44}
            />
            <Tooltip content={CustomTooltip} cursor={{ stroke: 'rgba(240,236,228,0.1)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="acumulado"
              name="Acumulado"
              stroke="#9b8ec4"
              strokeWidth={2}
              fill="url(#gradAcumulado)"
              dot={false}
              activeDot={{ r: 4, fill: '#9b8ec4', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
