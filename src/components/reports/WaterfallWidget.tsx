'use client';

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface WaterfallWidgetProps {
  data: {
    mes: string;
    start: number;
    end: number;
    ingresos: number;
    gastos: number;
    neto: number;
  }[];
}

export function WaterfallWidget({ data }: WaterfallWidgetProps) {
  // To draw a waterfall, we use a range bar chart [start, end]
  const chartData = data.map((d) => ({
    name: d.mes,
    range: [d.start, d.end],
    neto: d.neto,
    start: d.start,
    end: d.end,
  }));

  const formatEur = (v: number) => `${v.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€`;

  return (
    <div className="card p-5 h-[360px] flex flex-col">
      <h3 className="font-editorial text-lg text-[#f0ece4] mb-1">Flujo Acumulado</h3>
      <p className="text-[#5a5f75] text-xs mb-6">Evolución del balance neto mes a mes</p>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,236,228,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="#5a5f75" fontSize={11} tickMargin={10} />
            <YAxis stroke="#5a5f75" fontSize={11} tickFormatter={formatEur} />
            
            <Tooltip
              formatter={(value: any, name, props: any) => {
                const p = props.payload;
                return [
                  `Inicio: ${formatEur(p.start)} | Fin: ${formatEur(p.end)}`,
                  `Flujo neto: ${p.neto > 0 ? '+' : ''}${formatEur(p.neto)}`,
                ];
              }}
              labelStyle={{ color: '#9096b0', marginBottom: '8px' }}
              contentStyle={{
                backgroundColor: '#1b1d22',
                borderColor: 'rgba(240,236,228,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f0ece4',
              }}
            />

            <Bar dataKey="range" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.neto >= 0 ? '#7db88f' : '#b08080'} opacity={0.8} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
