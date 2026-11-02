import React, { useState, createElement } from 'react';
import {
  GitCompare,
  Check,
  Share2,
  MessageSquare,
  Sliders,
  BarChart3 } from
'lucide-react';
import { ExportButton } from '../components/common/ExportButton';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip } from
'recharts';
const radarData = [
{
  subject: 'Peak Cases',
  A: 120,
  B: 80,
  C: 40,
  fullMark: 150
},
{
  subject: 'Duration',
  A: 90,
  B: 120,
  C: 140,
  fullMark: 150
},
{
  subject: 'Econ Cost',
  A: 30,
  B: 90,
  C: 130,
  fullMark: 150
},
{
  subject: 'Mortality',
  A: 140,
  B: 70,
  C: 30,
  fullMark: 150
},
{
  subject: 'Resource Demand',
  A: 130,
  B: 85,
  C: 45,
  fullMark: 150
}];

const effectivenessData = [
{
  name: 'Full Lockdown',
  effectiveness: 80,
  fill: '#3B82F6'
},
{
  name: 'Vaccination',
  effectiveness: 75,
  fill: '#10B981'
},
{
  name: 'Mask Mandate',
  effectiveness: 40,
  fill: '#F59E0B'
},
{
  name: 'Social Distancing',
  effectiveness: 35,
  fill: '#8B5CF6'
},
{
  name: 'School Closure',
  effectiveness: 25,
  fill: '#EF4444'
}];

export function ScenarioComparison() {
  const [notes, setNotes] = useState('');
  const [sensitivityR0, setSensitivityR0] = useState(0);
  const [sensitivityAdherence, setSensitivityAdherence] = useState(0);
  const handleShare = () => {
    alert(
      'Scenario comparison link copied to clipboard. Ready to share with stakeholders.'
    );
  };
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">
            Scenario Comparison
          </h1>
          <p className="text-body text-text-secondary">
            Evaluate trade-offs between different intervention strategies
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="bg-surface border border-border hover:bg-background text-text-primary px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center transition-colors shadow-sm">
            
            <Share2 size={16} className="mr-2" />
            Share
          </button>
          <ExportButton
            label="Export Matrix"
            onExport={(fmt) => {
              if (fmt === 'json') {
                const blob = new Blob(
                  [
                  JSON.stringify(
                    {
                      exported: 'scenario-matrix',
                      at: new Date().toISOString()
                    },
                    null,
                    2
                  )],

                  {
                    type: 'application/json'
                  }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `scenario-matrix.${fmt}`;
                a.click();
              } else {
                alert(`${fmt.toUpperCase()} export coming soon!`);
              }
            }} />
          
        </div>
      </div>

      {/* Sensitivity Analysis Panel */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm mb-6">
        <div className="flex items-center mb-4">
          <Sliders size={18} className="text-primary mr-2" />
          <h3 className="text-[14px] font-bold text-text-primary uppercase tracking-wider">
            Sensitivity Analysis
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[11px] font-semibold text-text-secondary uppercase">
                Transmission Variance (R₀)
              </label>
              <span className="text-[11px] font-bold text-primary">
                {sensitivityR0 > 0 ? '+' : ''}
                {sensitivityR0}%
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={20}
              value={sensitivityR0}
              onChange={(e) => setSensitivityR0(Number(e.target.value))}
              className="w-full h-1.5 bg-background rounded-lg appearance-none accent-primary" />
            
            <p className="text-[10px] text-text-secondary mt-1">
              Adjust baseline transmission rate to test scenario robustness.
            </p>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[11px] font-semibold text-text-secondary uppercase">
                Adherence Variance
              </label>
              <span className="text-[11px] font-bold text-primary">
                {sensitivityAdherence > 0 ? '+' : ''}
                {sensitivityAdherence}%
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={20}
              value={sensitivityAdherence}
              onChange={(e) => setSensitivityAdherence(Number(e.target.value))}
              className="w-full h-1.5 bg-background rounded-lg appearance-none accent-primary" />
            
            <p className="text-[10px] text-text-secondary mt-1">
              Simulate lower or higher public compliance with NPIs.
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scenario A */}
        <div className="bg-surface p-6 rounded-xl border-2 border-danger/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-danger"></div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[16px] font-bold text-text-primary">
              Baseline (Do Nothing)
            </h3>
            <span className="bg-danger/15 text-danger text-[10px] font-bold px-2 py-1 rounded">
              High Risk
            </span>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-[12px] text-text-secondary">
              <Check size={14} className="mr-2 text-border" /> No interventions
            </div>
          </div>
          <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-text-secondary uppercase">
                Peak Cases
              </div>
              <div className="text-[18px] font-bold text-danger">
                {Math.round(420 * (1 + sensitivityR0 / 100))}K
              </div>
              <div className="text-[10px] text-text-secondary mt-0.5">
                95% CI: ±15%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-text-secondary uppercase">
                Duration
              </div>
              <div className="text-[18px] font-bold text-text-primary">
                90 Days
              </div>
            </div>
          </div>
        </div>

        {/* Scenario B */}
        <div className="bg-surface p-6 rounded-xl border-2 border-primary shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded">
            Recommended
          </div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[16px] font-bold text-text-primary">
              Targeted Mitigation
            </h3>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-[12px] text-text-secondary">
              <Check size={14} className="mr-2 text-primary" /> Mask Mandate
            </div>
            <div className="flex items-center text-[12px] text-text-secondary">
              <Check size={14} className="mr-2 text-primary" /> Contact Tracing
            </div>
          </div>
          <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-text-secondary uppercase">
                Peak Cases
              </div>
              <div className="text-[18px] font-bold text-warning">
                {Math.round(
                  180 * (
                  1 + sensitivityR0 / 100) * (
                  1 - sensitivityAdherence / 100)
                )}
                K
              </div>
              <div className="text-[10px] text-text-secondary mt-0.5">
                95% CI: ±12%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-text-secondary uppercase">
                Duration
              </div>
              <div className="text-[18px] font-bold text-text-primary">
                120 Days
              </div>
            </div>
          </div>
        </div>

        {/* Scenario C */}
        <div className="bg-surface p-6 rounded-xl border-2 border-blue-500/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[16px] font-bold text-text-primary">
              Maximum Suppression
            </h3>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-[12px] text-text-secondary">
              <Check size={14} className="mr-2 text-blue-500" /> Full Lockdown
            </div>
            <div className="flex items-center text-[12px] text-text-secondary">
              <Check size={14} className="mr-2 text-blue-500" /> Travel Ban
            </div>
          </div>
          <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-text-secondary uppercase">
                Peak Cases
              </div>
              <div className="text-[18px] font-bold text-success">
                {Math.round(
                  45 * (
                  1 + sensitivityR0 / 100) * (
                  1 - sensitivityAdherence / 100)
                )}
                K
              </div>
              <div className="text-[10px] text-text-secondary mt-0.5">
                95% CI: ±8%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-text-secondary uppercase">
                Duration
              </div>
              <div className="text-[18px] font-bold text-text-primary">
                180+ Days
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-h3 text-text-primary mb-6">
            Multidimensional Trade-offs
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{
                    fill: '#64748B',
                    fontSize: 11
                  }} />
                
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 150]}
                  tick={false}
                  axisLine={false} />
                
                <Radar
                  name="Baseline"
                  dataKey="A"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.2} />
                
                <Radar
                  name="Targeted"
                  dataKey="B"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.4} />
                
                <Radar
                  name="Maximum"
                  dataKey="C"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.2} />
                
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4 text-[12px]">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-danger mr-2"></div>Baseline
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-primary mr-2"></div>Targeted
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-blue-500 mr-2"></div>Maximum
            </div>
          </div>
        </div>

        {/* Intervention Effectiveness Ranking */}
        <div className="bg-surface p-6 rounded-xl border border-border">
          <h3 className="text-h3 text-text-primary mb-6 flex items-center">
            <BarChart3 size={18} className="text-primary mr-2" />
            Intervention Effectiveness Ranking
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={effectivenessData}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 40,
                  bottom: 5
                }}>
                
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#E2E8F0" />
                
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{
                    fontSize: 11,
                    fill: '#64748B'
                  }}
                  axisLine={false}
                  tickLine={false} />
                
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{
                    fontSize: 11,
                    fill: '#64748B'
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={100} />
                
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Effectiveness']} />
                
                <Bar
                  dataKey="effectiveness"
                  radius={[0, 4, 4, 0]}
                  barSize={24} />
                
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparison Matrix */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border">
            <h3 className="text-h3 text-text-primary">Comparison Matrix</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-micro text-text-secondary">
                    METRIC
                  </th>
                  <th className="px-6 py-4 text-micro text-danger">BASELINE</th>
                  <th className="px-6 py-4 text-micro text-primary">
                    TARGETED
                  </th>
                  <th className="px-6 py-4 text-micro text-blue-500">
                    MAXIMUM
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-background/50">
                  <td className="px-6 py-4 text-[13px] font-medium text-text-primary">
                    Total Infections
                    <div className="text-[10px] text-text-secondary font-normal">
                      95% Confidence Interval
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">
                    2.4M
                    <div className="text-[10px] text-text-secondary/70">
                      2.1M - 2.8M
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] font-bold text-text-primary">
                    850K
                    <div className="text-[10px] text-text-secondary font-normal">
                      780K - 950K
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">
                    120K
                    <div className="text-[10px] text-text-secondary/70">
                      95K - 150K
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-background/50">
                  <td className="px-6 py-4 text-[13px] font-medium text-text-primary">
                    Total Deaths
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">
                    48,000
                  </td>
                  <td className="px-6 py-4 text-[13px] font-bold text-text-primary">
                    12,500
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">
                    2,100
                  </td>
                </tr>
                <tr className="hover:bg-background/50">
                  <td className="px-6 py-4 text-[13px] font-medium text-text-primary">
                    ICU Overflow Days
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">
                    45 days
                  </td>
                  <td className="px-6 py-4 text-[13px] font-bold text-text-primary">
                    12 days
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">
                    0 days
                  </td>
                </tr>
                <tr className="hover:bg-background/50">
                  <td className="px-6 py-4 text-[13px] font-medium text-text-primary">
                    Economic Cost
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">
                    $45M
                  </td>
                  <td className="px-6 py-4 text-[13px] font-bold text-text-primary">
                    $120M
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">
                    $380M
                  </td>
                </tr>
                <tr className="hover:bg-background/50">
                  <td className="px-6 py-4 text-[13px] font-medium text-text-primary">
                    Social Disruption
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">
                    Low
                  </td>
                  <td className="px-6 py-4 text-[13px] font-bold text-text-primary">
                    Medium
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">
                    Severe
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes & Annotations */}
        <div className="bg-surface rounded-xl border border-border flex flex-col">
          <div className="p-6 border-b border-border flex items-center">
            <MessageSquare size={18} className="text-primary mr-2" />
            <h3 className="text-h3 text-text-primary">Notes & Annotations</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add collaborative notes, assumptions, or policy recommendations here..."
              className="flex-1 w-full bg-background border border-border rounded-lg p-3 text-[13px] text-text-primary focus:outline-none focus:border-primary resize-none min-h-[200px]" />
            
            <div className="mt-4 flex justify-end">
              <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors">
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>);

}