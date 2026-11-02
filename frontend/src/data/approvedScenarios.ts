import { ApprovedScenario } from '../types/policy';

// Scenarios approved by an Analyst for decision makers. Isolation beds: Rubavu district.
export const approvedScenarios: ApprovedScenario[] = [
{
  id: 'APS-01',
  name: 'Ebola · current response',
  diseaseId: 'ebola',
  plan: 'Sick people are isolated after about 4–5 days, half of burials are safe, and some contacts are followed up.',
  approvedBy: 'Dr. Sarah Icyeza',
  approvedOn: '05 Oct 2026',
  detectionDelay: 4.5,
  safeBurial: 0.5,
  contactTracing: 0.4,
  isolationBeds: 40
},
{
  id: 'APS-02',
  name: 'Ebola · isolate within 3 days',
  diseaseId: 'ebola',
  plan: 'Same as today, but sick people are found and isolated within 3 days.',
  approvedBy: 'Dr. Sarah Icyeza',
  approvedOn: '05 Oct 2026',
  detectionDelay: 3,
  safeBurial: 0.5,
  contactTracing: 0.4,
  isolationBeds: 40
},
{
  id: 'APS-03',
  name: 'Ebola · slow response (7 days)',
  diseaseId: 'ebola',
  plan: 'Sick people take about a week to be isolated, for example if testing is delayed.',
  approvedBy: 'Dr. Sarah Icyeza',
  approvedOn: '05 Oct 2026',
  detectionDelay: 7,
  safeBurial: 0.5,
  contactTracing: 0.4,
  isolationBeds: 40
},
{
  id: 'APS-04',
  name: 'Ebola · full package',
  diseaseId: 'ebola',
  plan: 'Isolation within 3 days, 80% safe burials and most contacts followed up daily.',
  approvedBy: 'Dr. Sarah Icyeza',
  approvedOn: '06 Oct 2026',
  detectionDelay: 3,
  safeBurial: 0.8,
  contactTracing: 0.7,
  isolationBeds: 40
},
{
  id: 'APS-05',
  name: 'Marburg · protect health workers early',
  diseaseId: 'marburg',
  plan: 'Hospital staff wear full protection from day 7 instead of day 21.',
  approvedBy: 'Dr. Sarah Icyeza',
  approvedOn: '06 Oct 2026',
  detectionDelay: 4,
  safeBurial: 0.6,
  contactTracing: 0.5,
  isolationBeds: 30,
  ppeAfter: 0.9,
  recognitionDay: 7
}];