'use client';

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from 'recharts';
import { PiggyBank } from 'lucide-react';

interface SavingsRateWidgetProps {
  rate: number; // 0–100
  totalIngresos: number;
  totalGastos: number;
  periodLabel: string;
}

export function SavingsRateWidget({ rate, totalIngresos, totalGastos, periodLabel }: SavingsRateWidgetProps) {
  const pct = Math.min(100, Math.max(0, rate));
  const savedAmount = totalIngresos - totalGastos;

  const fmt = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  // Color based on rate quality
  let accentColor = '#b08080'; // bad
  let label = 'Bajo';
  if (pct >= 20) { accentColor = '#c9a96e'; label = 'Moderado'; }
  if (pct >= 35) { accentColor = '#7db88f'; label = 'Bueno'; }
  if (pct >= 50) { accentColor = '#9b8ec4'; label = 'Excelente'; }

  const chartData = [
    { name: 'Tasa', value: pct, fill: accentColor },
    { name: 'Resto', value: 100 - pct, fill: 'rgba(240,236,228,0.06)' },
  ];

  return (
    <div className="card p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[#f0ece4] flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-[#6b8cae]" />
          Tasa de Ahorro
        </h3>
        <p className="section-label mt-1">{periodLabel}</p>
      </div>

      <div className="flex items-center gap-6">
        {/* Gauge */}
        <div className="relative flex-shrink-0 w-[110px] h-[110px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="95%"
              startAngle={225}
              endAngle={-45}
              data={chartData}
              barSize={10}
            >
              <RadialBar dataKey="value" cornerRadius={5} background={false} />
            </RadialBarChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-editorial text-xl" style={{ color: accentColor }}>
              {pct.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="section-label">Calidad</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: accentColor }}>{label}</p>
          </div>
          <div>
            <p className="section-label">Ahorrado</p>
            <p className="font-editorial text-base text-[#f0ece4] mt-0.5">
              {savedAmount >= 0 ? fmt(savedAmount) : `−${fmt(Math.abs(savedAmount))}`}
            </p>
          </div>
          <div>
            <p className="section-label">De ingresos totales</p>
            <p className="text-sm text-[#9096b0] mt-0.5">{fmt(totalIngresos)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
