import { type KpiData } from '@/lib/types';
import { type KpiComparison } from '@/actions/transactions';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEur(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─── Delta Badge ──────────────────────────────────────────────────────────────

function DeltaBadge({
  delta,
  invertColors = false,
  suffix = '%',
}: {
  delta: number;
  invertColors?: boolean;
  suffix?: string;
}) {
  const isPositive = delta > 0;
  const isZero = Math.abs(delta) < 0.05;

  // For gastos: going up is bad (red), going down is good (green)
  const goodColor  = invertColors ? '#b08080' : '#7db88f';
  const badColor   = invertColors ? '#7db88f' : '#b08080';
  const color      = isZero ? '#5a5f75' : isPositive ? goodColor : badColor;

  if (isZero) {
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-medium" style={{ color }}>
        <Minus className="w-3 h-3" />
        Sin cambio
      </span>
    );
  }

  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex items-center gap-0.5 text-[11px] font-medium" style={{ color }}>
      <Icon className="w-3 h-3" />
      {isPositive ? '+' : ''}{delta.toFixed(1)}{suffix} vs anterior
    </span>
  );
}

// ─── Single KPI Card ──────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  accentColor: string;
  subtitle?: string;
  subtitleColor?: string;
  delta?: number;
  deltaInverted?: boolean;
  deltaSuffix?: string;
}

function KpiCard({
  title,
  value,
  icon,
  accentColor,
  subtitle,
  subtitleColor,
  delta,
  deltaInverted,
  deltaSuffix,
}: KpiCardProps) {
  return (
    <div
      className="card p-5 flex flex-col gap-3 animate-fade-up"
      style={{ borderLeftColor: accentColor, borderLeftWidth: '3px' }}
    >
      <div className="flex items-center justify-between">
        <p className="section-label">{title}</p>
        <span style={{ color: accentColor }} className="opacity-80">
          {icon}
        </span>
      </div>

      <p
        className="font-editorial text-[1.65rem] leading-none tracking-tight"
        style={{ color: '#f0ece4' }}
      >
        {value}
      </p>

      <div className="flex items-center justify-between gap-2 min-h-[16px]">
        {subtitle && (
          <p className="text-xs" style={{ color: subtitleColor ?? '#9096b0' }}>
            {subtitle}
          </p>
        )}
        {delta !== undefined && (
          <DeltaBadge delta={delta} invertColors={deltaInverted} suffix={deltaSuffix} />
        )}
      </div>
    </div>
  );
}

// ─── KpiCards ─────────────────────────────────────────────────────────────────

interface KpiCardsProps {
  kpis: KpiData;
  periodLabel: string;
  comparison?: KpiComparison;
}

export function KpiCards({ kpis, periodLabel, comparison }: KpiCardsProps) {
  const savingsLabel =
    kpis.tasaAhorro > 0
      ? `${kpis.tasaAhorro.toFixed(1)}% de los ingresos`
      : 'Sin ahorro en este período';

  return (
    <div>
      <p className="section-label mb-4">{periodLabel}</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Ingresos"
          value={formatEur(kpis.totalIngresos)}
          icon={<TrendingUp className="w-4 h-4" />}
          accentColor="#7db88f"
          delta={comparison?.ingresosDelta}
        />
        <KpiCard
          title="Gastos"
          value={formatEur(kpis.totalGastos)}
          icon={<TrendingDown className="w-4 h-4" />}
          accentColor="#b08080"
          delta={comparison?.gastosDelta}
          deltaInverted
        />
        <KpiCard
          title="Beneficio neto"
          value={formatEur(kpis.beneficioNeto)}
          icon={<Wallet className="w-4 h-4" />}
          accentColor={kpis.beneficioNeto >= 0 ? '#9b8ec4' : '#c9a96e'}
          subtitleColor={kpis.beneficioNeto >= 0 ? '#9b8ec4' : '#c9a96e'}
          delta={comparison?.beneficioDelta}
        />
        <KpiCard
          title="Tasa de ahorro"
          value={`${kpis.tasaAhorro.toFixed(1)}%`}
          icon={<PiggyBank className="w-4 h-4" />}
          accentColor="#6b8cae"
          subtitle={savingsLabel}
          delta={comparison?.ahorroDelta}
          deltaSuffix=" pp"
        />
      </div>
    </div>
  );
}
