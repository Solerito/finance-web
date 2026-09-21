'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface FunnelWidgetProps {
  data: { categoria: string; total: number }[];
}

const COLORS = ['#b08080', '#c9a96e', '#7db88f', '#6b8cae', '#9b8ec4', '#c8c4bc'];

export function FunnelWidget({ data }: FunnelWidgetProps) {
  const formatEur = (v: number) => `${v.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€`;

  return (
    <div className="card p-5 h-[360px] flex flex-col">
      <h3 className="font-editorial text-lg text-[#f0ece4] mb-1">Distribución de Gasto</h3>
      <p className="text-[#5a5f75] text-xs mb-2">Top categorías (últimos 3 meses)</p>
      
      <div className="flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="total"
              nameKey="categoria"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [formatEur(value as number), 'Gasto']}
              contentStyle={{
                backgroundColor: '#1b1d22',
                borderColor: 'rgba(240,236,228,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f0ece4',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', color: '#c8c4bc' }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
          <span className="text-[10px] text-[#5a5f75] uppercase tracking-wider">Total Top 6</span>
          <span className="text-lg font-editorial text-[#f0ece4]">
            {formatEur(data.reduce((s, d) => s + d.total, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
