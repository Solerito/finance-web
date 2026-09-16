import { type KpiData } from '@/lib/types';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

function formatEur(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface KpiCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;         // e.g. "emerald"
  glowClass: string;          // shadow color
  prefix?: string;
}

function KpiCard({ title, value, icon, colorClass, glowClass }: KpiCardProps) {
  return (
    <div
      className={`relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl ${glowClass} transition-transform duration-300 hover:-translate-y-1`}
    >
      {/* Background glow blob */}
      <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full ${colorClass} opacity-20 blur-2xl pointer-events-none`} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-white tracking-tight">{formatEur(value)}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface KpiCardsProps {
  kpis: KpiData;
  monthLabel: string;
}

export function KpiCards({ kpis, monthLabel }: KpiCardsProps) {
  return (
    <div>
      <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-3">
        Resumen — {monthLabel}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total Ingresos"
          value={kpis.totalIngresos}
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          colorClass="bg-emerald-500"
          glowClass="hover:shadow-emerald-500/10"
        />
        <KpiCard
          title="Total Gastos"
          value={kpis.totalGastos}
          icon={<TrendingDown className="w-5 h-5 text-rose-400" />}
          colorClass="bg-rose-500"
          glowClass="hover:shadow-rose-500/10"
        />
        <KpiCard
          title="Beneficio Neto"
          value={kpis.beneficioNeto}
          icon={<Wallet className="w-5 h-5 text-indigo-400" />}
          colorClass={kpis.beneficioNeto >= 0 ? 'bg-indigo-500' : 'bg-amber-500'}
          glowClass="hover:shadow-indigo-500/10"
        />
      </div>
    </div>
  );
}
