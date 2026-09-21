'use client';

import { useMemo } from 'react';
import { type HeatmapDay } from '@/actions/transactions';
import { format, parseISO, eachDayOfInterval, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function getIntensity(value: number, max: number): number {
  if (max === 0 || value === 0) return 0;
  return Math.min(1, value / max);
}

function intensityToColor(intensity: number): string {
  if (intensity === 0) return 'rgba(240,236,228,0.04)';
  // Scale from sage-faint to dusty-rose
  const r = Math.round(125 + (176 - 125) * intensity);
  const g = Math.round(184 + (128 - 184) * intensity);
  const b = Math.round(143 + (128 - 143) * intensity);
  const a = 0.25 + intensity * 0.75;
  return `rgba(${r},${g},${b},${a})`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SpendingHeatmapProps {
  data: HeatmapDay[];
  from: string;
  to: string;
}

export function SpendingHeatmap({ data, from, to }: SpendingHeatmapProps) {
  const { weeks, maxGasto, byDate } = useMemo(() => {
    const map = new Map<string, number>(data.map((d) => [d.fecha, d.gastos]));
    const maxGasto = Math.max(0, ...data.map((d) => d.gastos));

    // Build full day list padded to complete weeks (Mon-start)
    const allDays = eachDayOfInterval({
      start: new Date(from),
      end: new Date(to),
    });

    // Group into weeks (7-day columns)
    const weekStart = startOfWeek(new Date(from), { weekStartsOn: 1 });
    const paddedStart = startOfWeek(allDays[0], { weekStartsOn: 1 });
    const paddedDays: (Date | null)[] = [];

    // Pad beginning
    const padDays = Math.round(
      (allDays[0].getTime() - paddedStart.getTime()) / 86_400_000,
    );
    for (let i = 0; i < padDays; i++) paddedDays.push(null);
    paddedDays.push(...allDays);
    // Pad end to multiple of 7
    while (paddedDays.length % 7 !== 0) paddedDays.push(null);

    // Chunk into weeks
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < paddedDays.length; i += 7) {
      weeks.push(paddedDays.slice(i, i + 7));
    }

    return { weeks, maxGasto, byDate: map, weekStart };
  }, [data, from, to]);

  if (data.length === 0) {
    return (
      <div className="card p-5">
        <p className="section-label mb-3">Mapa de Gastos Diarios</p>
        <div className="flex items-center justify-center py-10 text-[#5a5f75] text-sm">
          Sin datos en este período
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-[#f0ece4]">Mapa de Gastos Diarios</p>
        <div className="flex items-center gap-1.5 text-[11px] text-[#5a5f75]">
          <span>Menos</span>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <span
              key={v}
              className="w-3 h-3 rounded-sm inline-block"
              style={{ background: intensityToColor(v) }}
            />
          ))}
          <span>Más</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1 min-w-max">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-1 mr-1">
            {DAY_LABELS.map((d) => (
              <span key={d} className="text-[10px] text-[#5a5f75] w-4 h-4 flex items-center">
                {d}
              </span>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => {
                if (!day) {
                  return <span key={di} className="w-4 h-4 rounded-sm opacity-0" />;
                }
                const key = format(day, 'yyyy-MM-dd');
                const gasto = byDate.get(key) ?? 0;
                const intensity = getIntensity(gasto, maxGasto);
                const label = format(day, "d MMM — 'Gastos:' ", { locale: es });

                return (
                  <div
                    key={di}
                    className="w-4 h-4 rounded-sm cursor-default transition-transform hover:scale-125"
                    style={{ background: intensityToColor(intensity) }}
                    title={`${label}${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(gasto)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer: max day */}
      {maxGasto > 0 && (
        <p className="text-[11px] text-[#5a5f75] mt-3">
          Máx. diario:{' '}
          <span className="text-[#c49090]">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(maxGasto)}
          </span>
        </p>
      )}
    </div>
  );
}
