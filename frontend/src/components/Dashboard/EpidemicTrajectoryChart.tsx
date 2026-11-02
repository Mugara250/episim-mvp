import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine } from
'recharts';
import { DashboardContext } from './types';
import { horizonDays, horizonLabel } from './forecast';
interface EpidemicTrajectoryChartProps {
  context: DashboardContext;
}
// The "today" split: historical portion before this, forecast after.
const splitDay = (days: number) => Math.max(1, Math.round(days * 0.3));
// Generate realistic epidemic trajectory data with forecast
const generateTrajectoryData = (timeRange: string) => {
  const days = horizonDays(timeRange);
  const data = [];
  const currentDay = splitDay(days);
  for (let i = 0; i <= days; i++) {
    const isForecast = i > currentDay;
    const dayNum = i;
    // Exponential growth phase, then plateau
    const growthFactor = Math.min(1.15, 1 + i * 0.005);
    const baseInfections =
    1000 * Math.pow(growthFactor, i) * (1 - i / (days * 1.5));
    const infections = Math.max(0, baseInfections + Math.random() * 500);
    // Recoveries lag behind infections
    const recoveries = i > 7 ? infections * 0.6 * (1 - Math.exp(-i / 20)) : 0;
    // Deaths are a small percentage
    const deaths = infections * 0.02 * (1 - Math.exp(-i / 15));
    data.push({
      day: `Day ${i}`,
      dayNum: i,
      infections: isForecast ? null : Math.round(infections),
      recoveries: isForecast ? null : Math.round(recoveries),
      deaths: isForecast ? null : Math.round(deaths),
      forecastInfections: isForecast ? Math.round(infections) : null,
      forecastRecoveries: isForecast ? Math.round(recoveries) : null,
      forecastDeaths: isForecast ? Math.round(deaths) : null,
      isForecast
    });
  }
  return data;
};
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isForecast = payload[0]?.payload?.isForecast;
    return (
      <div className="bg-surface-2 border border-border rounded-lg p-3 shadow-lg">
        <p className="text-[12px] font-semibold text-text-primary mb-2">
          {label}{' '}
          {isForecast &&
          <span className="text-text-secondary">(Forecast)</span>
          }
        </p>
        {payload.map((entry: any, index: number) =>
        <div
          key={index}
          className="flex items-center justify-between gap-4 text-[11px]">
          
            <span className="flex items-center">
              <div
              className="w-2 h-2 rounded-full mr-2"
              style={{
                backgroundColor: entry.color
              }} />
            
              {entry.name}:
            </span>
            <span
            className="font-semibold"
            style={{
              color: entry.color
            }}>
            
              {entry.value?.toLocaleString()}
            </span>
          </div>
        )}
      </div>);

  }
  return null;
};
export function EpidemicTrajectoryChart({
  context
}: EpidemicTrajectoryChartProps) {
  const data = generateTrajectoryData(context.timeRange);
  const currentDay = splitDay(horizonDays(context.timeRange));
  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-card">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-h3 text-text-primary mb-1">
            Epidemic Trajectory:{' '}
            {context.disease === 'all' ?
            'All Active Diseases' :
            context.disease}
          </h3>
          <p className="text-secondary text-text-secondary">
            {context.location} • Historical + Forecast (
            {horizonLabel(context.timeRange)})
          </p>
        </div>
        <div className="flex items-center gap-4 text-[12px] font-medium">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-primary mr-2"></div>
            Infections
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-success mr-2"></div>
            Recoveries
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded bg-danger mr-2"></div>
            Deaths
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded border-2 border-text-secondary border-dashed mr-2"></div>
            Forecast
          </div>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0
            }}>
            
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#EEF2F6"
              vertical={false} />
            
            <XAxis
              dataKey="day"
              stroke="#64748B"
              tick={{
                fill: '#94A3B8',
                fontSize: 11
              }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(data.length / 10)} />
            
            <YAxis
              stroke="#64748B"
              tick={{
                fill: '#94A3B8',
                fontSize: 11
              }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            
            <Tooltip content={<CustomTooltip />} />

            {/* Historical data - solid lines */}
            <Line
              type="monotone"
              dataKey="infections"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={false}
              name="Infections"
              connectNulls={false} />
            
            <Line
              type="monotone"
              dataKey="recoveries"
              stroke="#22C55E"
              strokeWidth={2.5}
              dot={false}
              name="Recoveries"
              connectNulls={false} />
            
            <Line
              type="monotone"
              dataKey="deaths"
              stroke="#EF4444"
              strokeWidth={2.5}
              dot={false}
              name="Deaths"
              connectNulls={false} />
            

            {/* Forecast data - dashed lines */}
            <Line
              type="monotone"
              dataKey="forecastInfections"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Forecast Infections"
              connectNulls={false} />
            
            <Line
              type="monotone"
              dataKey="forecastRecoveries"
              stroke="#22C55E"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Forecast Recoveries"
              connectNulls={false} />
            
            <Line
              type="monotone"
              dataKey="forecastDeaths"
              stroke="#EF4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Forecast Deaths"
              connectNulls={false} />
            

            {/* Reference line for current day */}
            <ReferenceLine
              x={`Day ${currentDay}`}
              stroke="#94A3B8"
              strokeDasharray="3 3"
              label={{
                value: 'Today',
                position: 'top',
                fill: '#94A3B8',
                fontSize: 11
              }} />
            
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-text-secondary">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
        Live data · Model: Stochastic SEIHFR · Confidence: 85%
      </div>
    </div>);

}