import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell } from
'recharts';
import { DashboardContext } from './types';
import {
  Activity,
  ShieldAlert,
  Server,
  Clock,
  CheckCircle2,
  X,
  TrendingDown,
  Skull,
  HeartPulse } from
'lucide-react';
import { EpidemicTrajectoryChart } from './EpidemicTrajectoryChart';
import { RwandaMap } from '../Geographic/RwandaMap';
import { SIMULATIONS, SimulationRecord } from '../../lib/simulations';
type Simulation = SimulationRecord;
const HOTSPOT_REGIONS = [
{
  name: 'Kigali City',
  risk: 'Critical',
  cases: 12450,
  r0: 2.1,
  color: '#EF4444',
  lat: -1.9536,
  lng: 30.0606
},
{
  name: 'Western Province',
  risk: 'High',
  cases: 8200,
  r0: 1.8,
  color: '#F97316',
  lat: -2.0606,
  lng: 29.3486
},
{
  name: 'Eastern Province',
  risk: 'Medium',
  cases: 3400,
  r0: 1.2,
  color: '#F59E0B',
  lat: -2.1597,
  lng: 30.5419
},
{
  name: 'Southern Province',
  risk: 'Low',
  cases: 1200,
  r0: 0.9,
  color: '#10B981',
  lat: -2.5967,
  lng: 29.7392
},
{
  name: 'Northern Province',
  risk: 'Low',
  cases: 850,
  r0: 0.8,
  color: '#10B981',
  lat: -1.4997,
  lng: 29.6347
}];

const RECENT_SIMULATIONS = SIMULATIONS;
function SimulationResultsModal({
  simulation,
  onClose,
  onOpenReport




}: {simulation: Simulation;onClose: () => void;onOpenReport: () => void;}) {
  const metrics = [
  {
    icon: TrendingDown,
    label: 'Peak Infections',
    value: simulation.peakInfections.toLocaleString(),
    color: 'text-primary'
  },
  {
    icon: Activity,
    label: 'Total Cases',
    value: simulation.totalCases.toLocaleString(),
    color: 'text-text-primary'
  },
  {
    icon: HeartPulse,
    label: 'Recoveries',
    value: simulation.recoveries.toLocaleString(),
    color: 'text-success'
  },
  {
    icon: Skull,
    label: 'Fatalities',
    value: simulation.fatalities.toLocaleString(),
    color: 'text-danger'
  }];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Results for ${simulation.id}`}
      onClick={onClose}>
      
      <div
        className="bg-surface border border-border rounded-xl shadow-card w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div>
            <h3 className="text-h3 text-text-primary">
              {simulation.id}: {simulation.name}
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-text-secondary mt-1">
              <span>{simulation.model} Model</span>
              <span>·</span>
              <span className="text-success font-medium">
                {simulation.status}
              </span>
              <span>·</span>
              <span className="flex items-center">
                <Clock size={11} className="mr-1" />
                {simulation.duration}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close results"
            className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-background">
            
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m) =>
            <div
              key={m.label}
              className="bg-background border border-border rounded-lg p-4">
              
                <div className="text-micro text-text-secondary mb-1 flex items-center">
                  <m.icon size={12} className="mr-1.5" />
                  {m.label.toUpperCase()}
                </div>
                <div className={`text-h2 ${m.color}`}>{m.value}</div>
              </div>
            )}
          </div>

          <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="text-micro text-text-secondary mb-1">
              KEY FINDING
            </div>
            <p className="text-[14px] font-medium text-primary">
              {simulation.result}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-[13px] font-medium text-text-primary hover:bg-background transition-colors">
            
            Close
          </button>
          <button
            onClick={onOpenReport}
            className="px-4 py-2 rounded-lg bg-primary text-[13px] font-medium text-white hover:bg-primary-dark transition-colors">
            
            Open Full Report
          </button>
        </div>
      </div>
    </div>);

}
const chartData = [
{
  name: 'Mon',
  infections: 1200,
  recoveries: 300,
  deaths: 10
},
{
  name: 'Tue',
  infections: 1800,
  recoveries: 400,
  deaths: 15
},
{
  name: 'Wed',
  infections: 2300,
  recoveries: 600,
  deaths: 20
},
{
  name: 'Thu',
  infections: 1900,
  recoveries: 800,
  deaths: 25
},
{
  name: 'Fri',
  infections: 2600,
  recoveries: 1000,
  deaths: 30
},
{
  name: 'Sat',
  infections: 2100,
  recoveries: 1200,
  deaths: 35
},
{
  name: 'Sun',
  infections: 3100,
  recoveries: 1500,
  deaths: 40
}];

const priorityData = [
{
  name: 'Marburg',
  risk: 70
},
{
  name: 'Ebola',
  risk: 45
}];

export function DiseaseSpecificView({
  context,
  onNavigate



}: {context: DashboardContext;onNavigate?: (route: string, reportId?: string) => void;}) {
  const [activeSimulation, setActiveSimulation] = useState<Simulation | null>(
    null
  );
  return (
    <div className="space-y-6">
      {/* Import and use the new trajectory chart */}
      <EpidemicTrajectoryChart context={context} />

      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-h3 text-text-primary">Recent Simulations</h3>
          <p className="text-[11px] text-text-secondary mt-1">
            Latest scenario modeling runs for {context.disease}
          </p>
        </div>
        <div className="divide-y divide-border">
          {RECENT_SIMULATIONS.map((sim) =>
          <div
            key={sim.id}
            className="p-4 flex items-center justify-between hover:bg-background/50 transition-colors">
            
              <div className="flex items-center flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                  <Activity className="text-primary" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold text-text-primary">
                      {sim.id}: {sim.name}
                    </span>
                    <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                      {sim.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-text-secondary">
                    <span>{sim.model} Model</span>
                    <span>·</span>
                    <span>{sim.time}</span>
                    <span>·</span>
                    <span className="text-primary font-medium">
                      {sim.result}
                    </span>
                  </div>
                </div>
              </div>
              <button
              onClick={() => setActiveSimulation(sim)}
              className="text-[12px] font-medium text-primary hover:underline ml-4">
              
                View Results
              </button>
            </div>
          )}
        </div>
      </div>

      {activeSimulation &&
      <SimulationResultsModal
        simulation={activeSimulation}
        onClose={() => setActiveSimulation(null)}
        onOpenReport={() => {
          const id = activeSimulation.id;
          setActiveSimulation(null);
          onNavigate?.('/reports', id);
        }} />

      }
    </div>);

}
export function DistrictFocusView({ context }: {context: DashboardContext;}) {
  const [selectedRegion, setSelectedRegion] = useState<
    (typeof HOTSPOT_REGIONS)[number] | null>(
    null);
  return (
    <div className="space-y-6">
      <div className="bg-surface p-6 rounded-xl border border-border shadow-card">
        <h3 className="text-h3 text-text-primary mb-1">
          Geographic Hotspots: {context.location}
        </h3>
        <p className="text-[12px] text-text-secondary mb-4">
          Transmission clusters for {context.disease} across Rwanda
        </p>
        <div className="aspect-video rounded-lg border border-border relative overflow-hidden">
          <RwandaMap
            regions={HOTSPOT_REGIONS}
            activeLayer="heatmap"
            selectedRegion={selectedRegion}
            onRegionClick={(r) => setSelectedRegion(r)} />
          

          {/* Risk legend overlay */}
          <div className="absolute bottom-3 right-3 z-[400] bg-surface px-3 py-2 rounded-lg shadow-lg border border-border">
            <div className="text-micro text-text-secondary mb-1.5">
              RISK LEVEL
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center text-[10px] text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-danger mr-1" />
                Critical
              </span>
              <span className="flex items-center text-[10px] text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-warning mr-1" />
                Elevated
              </span>
              <span className="flex items-center text-[10px] text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-success mr-1" />
                Low
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface p-5 rounded-xl border border-border shadow-card">
          <h3 className="text-[13px] font-semibold text-text-primary mb-4">
            Healthcare Capacity
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-text-secondary">ICU Beds</span>
                <span className="font-medium text-danger">92%</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-danger w-[92%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-text-secondary">General Ward</span>
                <span className="font-medium text-warning">75%</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-warning w-[75%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-text-secondary">Ventilators</span>
                <span className="font-medium text-success">45%</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-success w-[45%]"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border shadow-card">
          <h3 className="text-[13px] font-semibold text-text-primary mb-4">
            Active Clusters
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded bg-danger/5 border border-danger/10">
              <span className="text-[13px] font-medium text-text-primary">
                Sector A
              </span>
              <span className="text-[11px] font-bold text-danger">
                High Risk
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-warning/5 border border-warning/10">
              <span className="text-[13px] font-medium text-text-primary">
                Sector B
              </span>
              <span className="text-[11px] font-bold text-warning">
                Elevated
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-background border border-border">
              <span className="text-[13px] font-medium text-text-primary">
                Sector C
              </span>
              <span className="text-[11px] font-bold text-text-secondary">
                Monitoring
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>);

}
export function StrategicPriorityView({
  context


}: {context: DashboardContext;}) {
  return (
    <div className="space-y-6">
      <div className="bg-surface p-6 rounded-xl border border-border shadow-card">
        <h3 className="text-h3 text-text-primary mb-6">
          National Disease Prioritization
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={priorityData}
              layout="vertical"
              margin={{
                top: 5,
                right: 30,
                left: 40,
                bottom: 5
              }}>
              
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
                stroke="#E2E8F0" />
              
              <XAxis
                type="number"
                tick={{
                  fontSize: 12,
                  fill: '#64748B'
                }}
                axisLine={false}
                tickLine={false} />
              
              <YAxis
                dataKey="name"
                type="category"
                tick={{
                  fontSize: 12,
                  fill: '#64748B'
                }}
                axisLine={false}
                tickLine={false} />
              
              <Tooltip
                cursor={{
                  fill: '#F1F5F9'
                }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} />
              
              <Bar
                dataKey="risk"
                name="Risk Score"
                radius={[0, 4, 4, 0]}
                barSize={24}>
                
                {priorityData.map((entry, index) =>
                <Cell
                  key={`cell-${index}`}
                  fill={
                  entry.risk > 70 ?
                  '#EF4444' :
                  entry.risk > 40 ?
                  '#F59E0B' :
                  '#3B82F6'
                  } />

                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>);

}
export function AdminOverviewView() {
  return (
    <div className="space-y-6">
      <div className="bg-surface p-6 rounded-xl border border-border shadow-card">
        <h3 className="text-h3 text-text-primary mb-4">System Activity Log</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <Server size={16} className="text-text-secondary mt-0.5 mr-3" />
            <div>
              <p className="text-[13px] text-text-primary">
                Database backup completed successfully.
              </p>
              <p className="text-[11px] text-text-secondary">10 mins ago</p>
            </div>
          </div>
          <div className="flex items-start">
            <ShieldAlert size={16} className="text-warning mt-0.5 mr-3" />
            <div>
              <p className="text-[13px] text-text-primary">
                Failed login attempt from IP 192.168.1.42.
              </p>
              <p className="text-[11px] text-text-secondary">45 mins ago</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle2 size={16} className="text-success mt-0.5 mr-3" />
            <div>
              <p className="text-[13px] text-text-primary">
                New user 'Dr. Murekatete' provisioned.
              </p>
              <p className="text-[11px] text-text-secondary">2 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>);

}