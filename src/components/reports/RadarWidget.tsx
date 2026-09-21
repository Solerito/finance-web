'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface RadarWidgetProps {
  data: { subject: string; A: number; fullMark: number }[];
}

export function RadarWidget({ data }: RadarWidgetProps) {
  return (
    <div className="card p-5 h-[360px] flex flex-col">
      <h3 className="font-editorial text-lg text-[#f0ece4] mb-1">Salud Financiera</h3>
      <p className="text-[#5a5f75] text-xs mb-2">Puntuación global en 5 dimensiones</p>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="rgba(240,236,228,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#c8c4bc', fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1b1d22',
                borderColor: 'rgba(240,236,228,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f0ece4',
              }}
              formatter={(value: any) => [`${value} / 100`, 'Puntuación']}
            />
            <Radar
              name="Salud"
              dataKey="A"
              stroke="#6b8cae"
              fill="#6b8cae"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
