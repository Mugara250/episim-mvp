import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { CHART } from '../models/chartTheme';
import { HospitalEntry } from '../../types/officer';
import { addDays, dailyOccupancy, formatDay, OCCUPANCY_WARNING } from '../../utils/hospital';

const HORIZON = 14;

/** Observed occupancy, then a trend-based range for the next two weeks. */
function buildRows(entries: HospitalEntry[]) {
  const days = dailyOccupancy(entries);
  if (!days.length) return { rows: [], total: 0 };
  const recent = days.slice(-7);
  const n = recent.length;
  const xMean = (n - 1) / 2;
  const yMean = recent.reduce((s, d) => s + d.occupied, 0) / n;
  const num = recent.reduce((s, d, i) => s + (i - xMean) * (d.occupied - yMean), 0);
  const den = recent.reduce((s, _d, i) => s + (i - xMean) ** 2, 0) || 1;
  const slope = num / den;
  const last = days[days.length - 1];

  const rows: {day: string;observed?: number;median?: number;band?: [number, number];}[] = days.map((d) => ({
    day: formatDay(d.date),
    observed: d.occupied
  }));
  rows[rows.length - 1] = { ...rows[rows.length - 1], median: last.occupied, band: [last.occupied, last.occupied] };
  for (let i = 1; i <= HORIZON; i++) {
    const median = Math.max(0, last.occupied + slope * i * (1 - i / (HORIZON * 3)));
    const spread = 1 + 0.55 * i;
    rows.push({
      day: formatDay(addDays(last.date, i)),
      median: Math.round(median * 10) / 10,
      band: [Math.max(0, Math.round((median - spread * 0.8) * 10) / 10), Math.round((median + spread) * 10) / 10]
    });
  }
  return { rows, total: last.total };
}

export function BedOccupancyChart({ entries }: {entries: HospitalEntry[];}) {
  const { rows, total } = buildRows(entries);
  return (
    <div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="day" tick={CHART.tick} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis tick={CHART.tick} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
            <Tooltip
              contentStyle={CHART.tooltip}
              formatter={(v: number | number[], key: string) => {
                if (key === 'band') return [Array.isArray(v) ? `${v[0]}–${v[1]}` : v, 'Estimated range'];
                if (key === 'median') return [v, 'Trend estimate'];
                return [v, 'Beds occupied'];
              }} />
            
            <ReferenceLine y={total} stroke={CHART.danger} strokeDasharray="4 4" label={{ value: `${total} beds`, position: 'insideTopRight', fontSize: 11, fill: CHART.danger }} />
            <ReferenceLine y={Math.round(total * OCCUPANCY_WARNING)} stroke={CHART.warning} strokeDasharray="2 4" />
            <Area dataKey="band" stroke="none" fill={CHART.blue} fillOpacity={0.16} isAnimationActive={false} />
            <Line dataKey="median" stroke={CHART.blue} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
            <Line dataKey="observed" stroke={CHART.primary} strokeWidth={2.5} dot={{ r: 2.5 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-[12px] text-text-secondary">
        <span className="flex items-center gap-2"><span className="w-4 h-0.5 bg-primary rounded" />Reported</span>
        <span className="flex items-center gap-2"><span className="w-4 border-t-2 border-dashed" style={{ borderColor: CHART.blue }} />Trend estimate</span>
        <span className="flex items-center gap-2"><span className="w-4 h-3 rounded-sm" style={{ background: `${CHART.blue}33` }} />Uncertainty range</span>
        <span className="flex items-center gap-2"><span className="w-4 border-t-2 border-dashed border-warning" />80% full</span>
      </div>
    </div>);

}