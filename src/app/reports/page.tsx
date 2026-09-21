import { Suspense } from 'react';
import { BarChart3 } from 'lucide-react';
import { getScatterData, getWaterfallData, getRadarData, getFunnelData } from './actions';
import { ScatterWidget } from '@/components/reports/ScatterWidget';
import { WaterfallWidget } from '@/components/reports/WaterfallWidget';
import { RadarWidget } from '@/components/reports/RadarWidget';
import { FunnelWidget } from '@/components/reports/FunnelWidget';

function ReportsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card h-[360px] animate-pulse" />
      ))}
    </div>
  );
}

async function ReportsContent() {
  const [scatter, waterfall, radar, funnel] = await Promise.all([
    getScatterData(),
    getWaterfallData(),
    getRadarData(),
    getFunnelData(),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <WaterfallWidget data={waterfall} />
      <ScatterWidget data={scatter} />
      <FunnelWidget data={funnel} />
      <RadarWidget data={radar} />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <header className="mb-6">
        <h1 className="font-editorial text-xl text-[#f0ece4] tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#c9a96e]" />
          Reportes Avanzados
        </h1>
        <p className="text-[#5a5f75] text-xs mt-0.5">
          Análisis visual del flujo de caja, volatilidad y salud financiera
        </p>
      </header>

      <Suspense fallback={<ReportsSkeleton />}>
        <ReportsContent />
      </Suspense>
    </main>
  );
}
