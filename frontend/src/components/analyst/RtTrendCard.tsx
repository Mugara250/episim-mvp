import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { ArrowRight } from 'lucide-react';
import { CHART } from '../models/chartTheme';
import { RtPoint } from '../../types/simulationRuns';

function dateOf(start: string, day: number) {
  const d = new Date(start);
  d.setDate(d.getDate() + day);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function RtTrendCard({
  points,
  startDate,
  label,
  onOpen





}: {points: RtPoint[];startDate: string;label: string;onOpen: () => void;}) {
  const rows = points.
  filter((p) => p.rt !== null).
  map((p) => ({
    date: dateOf(startDate, p.day),
    rt: Number((p.rt ?? 0).toFixed(2)),
    band: [Number((p.low ?? 0).toFixed(2)), Number(Math.min(p.high ?? 0, 6).toFixed(2))]
  }));

  return (
    <section className="bg-surface p-6 rounded-xl border border-border">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-h3 text-text-primary">Rt trend</h2>
          <p className="text-[12px] text-text-secondary mt-1">
            {label}. Line: Rt estimate. Shaded: 95% uncertainty range. Above 1, the outbreak tends to grow.
          </p>
        </div>
        <button onClick={onOpen} className="text-[12px] font-semibold text-primary hover:underline flex items-center whitespace-nowrap">
          Rt Tracking <ArrowRight size={13} className="ml-1" />
        </button>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="date" tick={CHART.tick} axisLine={false} tickLine={false} minTickGap={30} />
            <YAxis tick={CHART.tick} axisLine={false} tickLine={false} width={36} domain={[0, 'auto']} />
            <Tooltip
              contentStyle={CHART.tooltip}
              formatter={(v: number | number[], key: string) =>
              key === 'band' ? [Array.isArray(v) ? `${v[0]}–${v[1]}` : v, '95% range'] : [v, 'Rt estimate']
              } />
            
            <ReferenceLine y={1} stroke={CHART.danger} strokeDasharray="4 4" />
            <Area dataKey="band" stroke="none" fill={CHART.primary} fillOpacity={0.18} isAnimationActive={false} />
            <Line dataKey="rt" stroke={CHART.primary} strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>);

}