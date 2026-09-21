'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';

interface ScatterWidgetProps {
  data: { dia: string; label: string; ingresos: number; gastos: number }[];
}

export function ScatterWidget({ data }: ScatterWidgetProps) {
  return (
    <div className="card p-5 h-[360px] flex flex-col">
      <h3 className="font-editorial text-lg text-[#f0ece4] mb-1">Volatilidad Diaria</h3>
      <p className="text-[#5a5f75] text-xs mb-6">Correlación entre ingresos y gastos por día (últimos 6 meses)</p>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,236,228,0.05)" />
            <XAxis
              type="number"
              dataKey="ingresos"
              name="Ingresos"
              unit="€"
              stroke="#5a5f75"
              fontSize={11}
              tickFormatter={(v) => (v > 0 ? `${v}€` : '0')}
            />
            <YAxis
              type="number"
              dataKey="gastos"
              name="Gastos"
              unit="€"
              stroke="#5a5f75"
              fontSize={11}
              tickFormatter={(v) => (v > 0 ? `${v}€` : '0')}
            />
            <ZAxis type="category" dataKey="label" name="Día" />
            
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'rgba(240,236,228,0.2)' }}
              contentStyle={{
                backgroundColor: '#1b1d22',
                borderColor: 'rgba(240,236,228,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#c8c4bc',
              }}
              itemStyle={{ color: '#f0ece4' }}
            />
            
            <Scatter
              name="Días"
              data={data}
              fill="#9b8ec4"
              opacity={0.6}
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
