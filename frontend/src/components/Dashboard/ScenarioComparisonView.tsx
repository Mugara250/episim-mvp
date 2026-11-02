import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend } from
'recharts';
import { CheckCircle2, Award } from 'lucide-react';
interface MockScenario {
  id: string;
  name: string;
  interventions: {reduction: number;}[];
  results: {peakCases: number;peakReduction: number;livesSaved: number;cost: number;};
}

// Illustrative sample scenarios for the dashboard comparison view
const MOCK_SCENARIOS: MockScenario[] = [
{ id: 'baseline', name: 'Baseline (no action)', interventions: [], results: { peakCases: 4200, peakReduction: 0, livesSaved: 0, cost: 0 } },
{ id: 'tracing', name: 'Contact tracing + isolation', interventions: [{ reduction: 0.3 }, { reduction: 0.25 }], results: { peakCases: 2100, peakReduction: 50, livesSaved: 640, cost: 2.4 } },
{ id: 'lockdown', name: 'Partial lockdown + masking', interventions: [{ reduction: 0.35 }, { reduction: 0.1 }], results: { peakCases: 2500, peakReduction: 40, livesSaved: 510, cost: 6.8 } },
{ id: 'vaccination', name: 'Ring vaccination + safe burials', interventions: [{ reduction: 0.4 }, { reduction: 0.2 }], results: { peakCases: 1500, peakReduction: 64, livesSaved: 820, cost: 4.1 } }];


function generateCurveData(interventions: {reduction: number;}[]) {
  const factor = interventions.reduce((f, i) => f * (1 - i.reduction), 1);
  const peak = 4200 * factor;
  const peakDay = 60 + (1 - factor) * 30;
  const data = Array.from({ length: 180 }, (_, day) => ({
    day,
    intervened: peak * Math.exp(-Math.pow((day - peakDay) / 25, 2))
  }));
  return { data };
}
export function ScenarioComparisonView() {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    MOCK_SCENARIOS.slice(0, 3).map((s) => s.id)
  );
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const selectedScenarios = MOCK_SCENARIOS.filter((s) =>
  selectedIds.includes(s.id)
  );
  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
  const colorFor = (id: string) =>
  colors[selectedScenarios.findIndex((s) => s.id === id) % colors.length];
  // Combined trajectory data
  const chartData = Array.from({
    length: 180
  }).map((_, day) => {
    const point: any = {
      day
    };
    selectedScenarios.forEach((scen) => {
      const { data } = generateCurveData(scen.interventions);
      point[scen.id] = data[day].intervened;
    });
    return point;
  });
  // Best by ICER
  const bestScenario = selectedScenarios.
  filter((s) => s.results.livesSaved > 0).
  sort(
    (a, b) =>
    a.results.cost / a.results.livesSaved -
    b.results.cost / b.results.livesSaved
  )[0];
  return (
    <div className="space-y-6">
      {/* Scenario Selector */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {MOCK_SCENARIOS.map((scen) => {
          const isSelected = selectedIds.includes(scen.id);
          return (
            <div
              key={scen.id}
              onClick={() => toggleSelection(scen.id)}
              className={`flex-shrink-0 w-48 p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:border-primary/30'}`}>
              
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-[13px] font-bold text-text-primary truncate pr-2">
                  {scen.name}
                </h4>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-white' : 'border-border'}`}>
                  
                  {isSelected && <CheckCircle2 size={12} />}
                </div>
              </div>
              <div className="text-[11px] text-text-secondary">
                {scen.interventions.length} interventions
              </div>
            </div>);

        })}
      </div>

      {/* Trajectories Chart */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-card">
        <h3 className="text-h3 text-text-primary mb-6">
          Infection Trajectories Comparison
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 20,
                left: -20,
                bottom: 0
              }}>
              
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0" />
              
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fill: '#64748B'
                }} />
              
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fill: '#64748B'
                }}
                tickFormatter={(v) => `${v / 1000}k`} />
              
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0'
                }}
                formatter={(value: number) =>
                Math.round(value).toLocaleString()
                } />
              
              <Legend
                iconType="circle"
                wrapperStyle={{
                  fontSize: '12px'
                }} />
              
              {selectedScenarios.map((scen, idx) =>
              <Line
                key={scen.id}
                type="monotone"
                dataKey={scen.id}
                name={scen.name}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                dot={false} />

              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metrics Comparison Table */}
      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="text-h3 text-text-primary">Key Metrics Comparison</h3>
          {bestScenario &&
          <div className="flex items-center text-[11px] font-bold text-success bg-success/10 px-2 py-1 rounded">
              <Award size={14} className="mr-1" />
              Recommended: {bestScenario.name}
            </div>
          }
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="text-left px-6 py-3 text-micro text-text-secondary">
                  SCENARIO
                </th>
                <th className="text-right px-6 py-3 text-micro text-text-secondary">
                  PEAK CASES
                </th>
                <th className="text-right px-6 py-3 text-micro text-text-secondary">
                  PEAK REDUCTION
                </th>
                <th className="text-right px-6 py-3 text-micro text-text-secondary">
                  LIVES SAVED
                </th>
                <th className="text-right px-6 py-3 text-micro text-text-secondary">
                  TOTAL COST
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedScenarios.map((scen) =>
              <tr
                key={scen.id}
                className={`border-t border-border hover:bg-background transition-colors ${bestScenario?.id === scen.id ? 'bg-success/5' : ''}`}>
                
                  <td className="px-6 py-4 text-[13px] font-semibold text-text-primary flex items-center">
                    <div
                    className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0"
                    style={{
                      backgroundColor: colorFor(scen.id)
                    }} />
                  
                    {scen.name}
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary text-right">
                    {scen.results.peakCases.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-[13px] font-semibold text-text-primary text-right">
                    -{scen.results.peakReduction}%
                  </td>
                  <td className="px-6 py-4 text-[13px] font-semibold text-success text-right">
                    +{scen.results.livesSaved.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-[13px] font-semibold text-danger text-right">
                    ${scen.results.cost.toFixed(1)}M
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}