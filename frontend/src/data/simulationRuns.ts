import { SimulationRun } from '../types/simulationRuns';

// Past runs for the History tab. Summaries for completed runs are calculated from each scenario when the app loads.
export const simulationRunSeed: SimulationRun[] = [
{
  id: 'RUN-0098',
  scenarioId: 'SC-1048',
  horizonDays: 90,
  initialCases: 3,
  status: 'completed',
  requestedBy: 'Aline Uwase',
  startedAt: '2026-10-08T08:42:00',
  durationSec: 38,
  progress: 1,
  summary: null
},
{
  id: 'RUN-0097',
  scenarioId: 'SC-1042',
  horizonDays: 180,
  initialCases: 1,
  status: 'running',
  requestedBy: 'Aline Uwase',
  startedAt: '2026-10-08T09:05:00',
  durationSec: null,
  progress: 0.62,
  summary: null
},
{
  id: 'RUN-0096',
  scenarioId: 'SC-1039',
  horizonDays: 90,
  initialCases: 1,
  status: 'completed',
  requestedBy: 'Aline Uwase',
  startedAt: '2026-10-07T16:20:00',
  durationSec: 44,
  progress: 1,
  summary: null
},
{
  id: 'RUN-0095',
  scenarioId: 'SC-1044',
  horizonDays: 60,
  initialCases: 5,
  status: 'completed',
  requestedBy: 'Dr. Robert K.',
  startedAt: '2026-10-07T11:02:00',
  durationSec: 29,
  progress: 1,
  summary: null
},
{
  id: 'RUN-0094',
  scenarioId: 'SC-1031',
  horizonDays: 365,
  initialCases: 2,
  status: 'failed',
  requestedBy: 'Aline Uwase',
  startedAt: '2026-10-06T14:48:00',
  durationSec: 71,
  progress: 0.41,
  summary: null,
  error: 'The run stopped because the national dataset (version 1) was being re-imported at the same time. Try again once the import has finished.'
},
{
  id: 'RUN-0093',
  scenarioId: 'SC-1037',
  horizonDays: 90,
  initialCases: 1,
  status: 'completed',
  requestedBy: 'Dr. Eric Habimana',
  startedAt: '2026-10-05T10:15:00',
  durationSec: 41,
  progress: 1,
  summary: null
},
{
  id: 'RUN-0092',
  scenarioId: 'SC-1028',
  horizonDays: 180,
  initialCases: 1,
  status: 'cancelled',
  requestedBy: 'Dr. Sarah Icyeza',
  startedAt: '2026-10-03T09:30:00',
  durationSec: 12,
  progress: 0.2,
  summary: null
},
{
  id: 'RUN-0091',
  scenarioId: 'SC-1031',
  horizonDays: 180,
  initialCases: 1,
  status: 'completed',
  requestedBy: 'Aline Uwase',
  startedAt: '2026-09-29T15:12:00',
  durationSec: 96,
  progress: 1,
  summary: null
}];