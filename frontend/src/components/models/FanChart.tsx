import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer } from
'recharts';
import { Band } from '../../types/simulationRuns';
import { CHART } from './chartTheme';

export interface FanSeries {
  key: string;
  label: string;
  color: string;
  data: Band[];
}

export function FanChart({
  series,
  threshold,
  thresholdLabel,
  height = 280





}: {series: FanSeries[];threshold?: number;thresholdLabel?: string;height?: number;}) {
  const days = series[0]?.data.length ?? 0;
  const rows = Array.from({ length: days }, (_, d) => {
    const row: Record<string, number | number[]> = { day: d };
    series.forEach((s) => {
      const b = s.data[d];
      row[`${s.key}Band`] = [Math.round(b.low), Math.round(b.high)];
      row[`${s.key}Median`] = Math.round(b.median);
    });
    return row;
  });

  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="day" tick={CHART.tick} axisLine={false} tickLine={false} tickFormatter={(d) => `Day ${d}`} minTickGap={40} />
            <YAxis tick={CHART.tick} axisLine={false} tickLine={false} width={48} />
            <Tooltip
              contentStyle={CHART.tooltip}
              labelFormatter={(d) => `Day ${d}`}
              formatter={(v: number | number[], key: string) => {
                const s = series.find((x) => key.startsWith(x.key));
                const label = key.endsWith('Band') ? `${s?.label} (5–95%)` : `${s?.label} (median)`;
                return [Array.isArray(v) ? `${v[0]}–${v[1]}` : v, label];
              }} />
            
            {threshold !== undefined &&
            <ReferenceLine
              y={threshold}
              stroke={CHART.danger}
              strokeDasharray="4 4"
              label={{ value: thresholdLabel ?? String(threshold), position: 'insideTopRight', fontSize: 11, fill: CHART.danger }} />

            }
            {series.map((s) =>
            <Area key={`${s.key}Band`} dataKey={`${s.key}Band`} stroke="none" fill={s.color} fillOpacity={0.16} isAnimationActive={false} />
            )}
            {series.map((s) =>
            <Line key={`${s.key}Median`} dataKey={`${s.key}Median`} stroke={s.color} strokeWidth={2} dot={false} isAnimationActive={false} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-[12px] text-text-secondary">
        {series.map((s) =>
        <span key={s.key} className="flex items-center gap-2">
            <span className="w-4 h-0.5 rounded" style={{ background: s.color }} />
            {s.label}
          </span>
        )}
        <span className="flex items-center gap-2">
          <span className="w-4 h-3 rounded-sm bg-text-secondary/20" />
          5–95% of runs
        </span>
        {threshold !== undefined &&
        <span className="flex items-center gap-2">
            <span className="w-4 border-t-2 border-dashed border-danger" />
            {thresholdLabel}
          </span>
        }
      </div>
    </div>);

}