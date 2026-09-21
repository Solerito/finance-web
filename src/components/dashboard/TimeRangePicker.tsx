'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { type TimePeriodPreset } from '@/lib/types';
import { CalendarRange } from 'lucide-react';

const PRESETS: { label: string; value: TimePeriodPreset | 'custom' }[] = [
  { label: '1M',   value: '1M' },
  { label: '3M',   value: '3M' },
  { label: '6M',   value: '6M' },
  { label: '1 año', value: '1Y' },
  { label: 'Año actual', value: 'YTD' },
  { label: 'Personalizado', value: 'custom' },
];

export function TimeRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPreset = (searchParams.get('period') as TimePeriodPreset | 'custom') ?? '1M';
  const currentFrom   = searchParams.get('from') ?? '';
  const currentTo     = searchParams.get('to')   ?? '';

  const [showCustom, setShowCustom] = useState(currentPreset === 'custom');
  const [fromDate,   setFromDate]   = useState(currentFrom);
  const [toDate,     setToDate]     = useState(currentTo);

  const navigate = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v) sp.set(k, v);
      }
      router.push(`/?${sp.toString()}`);
    },
    [router],
  );

  function selectPreset(preset: TimePeriodPreset | 'custom') {
    if (preset === 'custom') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    navigate({ period: preset });
  }

  function applyCustom() {
    if (!fromDate || !toDate) return;
    navigate({ period: 'custom', from: fromDate, to: toDate });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <CalendarRange className="w-3.5 h-3.5 text-[#5a5f75]" />
        <span className="section-label">Período</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            id={`trp-${p.value}`}
            onClick={() => selectPreset(p.value as TimePeriodPreset | 'custom')}
            className={`trp-btn ${currentPreset === p.value || (p.value === 'custom' && showCustom) ? 'active' : ''}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            id="trp-from"
            type="date"
            value={fromDate}
            max={toDate || today}
            onChange={(e) => setFromDate(e.target.value)}
            className="input-paper text-xs py-1.5 w-[140px]"
          />
          <span className="text-[#5a5f75] text-xs">→</span>
          <input
            id="trp-to"
            type="date"
            value={toDate}
            min={fromDate}
            max={today}
            onChange={(e) => setToDate(e.target.value)}
            className="input-paper text-xs py-1.5 w-[140px]"
          />
          <button
            id="trp-apply"
            onClick={applyCustom}
            disabled={!fromDate || !toDate}
            className="trp-btn active disabled:opacity-40"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
