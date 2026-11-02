// Single source of truth for simulation runs shared between the
// Dashboard "Recent Simulations" list and the Reports "Recent Reports" list.
// Opening a report from the dashboard focuses the matching entry here.

export interface SimulationRecord {
  id: string;
  name: string;
  model: string;
  disease: string;
  region: string;
  status: string;
  time: string; // relative, used on dashboard
  date: string; // absolute, used on reports page
  format: string; // export format shown on reports page
  result: string;
  duration: string;
  peakInfections: number;
  totalCases: number;
  fatalities: number;
  recoveries: number;
}

export const SIMULATIONS: SimulationRecord[] = [
{
  id: 'SIM-0042',
  name: 'Ebola · Safe burials vs baseline',
  model: 'Stochastic SEIHFR',
  disease: 'Ebola',
  region: 'Rubavu',
  status: 'Completed',
  time: '2h ago',
  date: 'Today, 10:42 AM',
  format: 'PDF',
  result: 'Median cases down 41%',
  duration: '0m 04s',
  peakInfections: 38,
  totalCases: 212,
  fatalities: 118,
  recoveries: 94
},
{
  id: 'SIM-0041',
  name: 'Marburg · Health-worker protection',
  model: 'Health-worker layer',
  disease: 'Marburg',
  region: 'Kigali City',
  status: 'Completed',
  time: '5h ago',
  date: 'Yesterday, 14:15 PM',
  format: 'Excel',
  result: 'Health-worker share 78% → 31%',
  duration: '0m 06s',
  peakInfections: 14,
  totalCases: 61,
  fatalities: 14,
  recoveries: 47
},
{
  id: 'SIM-0040',
  name: 'Ebola · Isolation bed stress test',
  model: 'Stochastic SEIHFR',
  disease: 'Ebola',
  region: 'Gasabo',
  status: 'Completed',
  time: '1d ago',
  date: '12 Mar 2026',
  format: 'PPTX',
  result: 'Beds run out in 34% of runs',
  duration: '0m 05s',
  peakInfections: 52,
  totalCases: 340,
  fatalities: 189,
  recoveries: 151
}];


export function getSimulation(id: string | null | undefined) {
  if (!id) return undefined;
  return SIMULATIONS.find((s) => s.id === id);
}