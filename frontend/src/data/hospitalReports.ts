import { HospitalReport } from '../types/officer';

// Reports for Gisenyi District Hospital only
export const hospitalReports: HospitalReport[] = [
{
  id: 'HR-012',
  title: 'Weekly situation · week 40',
  type: 'Weekly situation',
  period: '29 Sep – 5 Oct 2026',
  published: '06 Oct 2026',
  by: 'Dr. Sarah Icyeza',
  summary:
  'Ebola admissions kept rising this week and isolation bed use passed 75%. Scenario estimates suggest occupancy may stay high for the next two weeks, within a wide uncertainty range.',
  figures: [
  { label: 'Confirmed cases (Ebola)', value: '9', range: 'reported' },
  { label: 'Peak beds needed, next 14 days', value: '23', range: '17–30 (5–95%)' },
  { label: 'Health workers infected', value: '3', range: 'reported' }]

},
{
  id: 'HR-011',
  title: 'Isolation capacity review',
  type: 'Capacity review',
  period: 'October 2026',
  published: '03 Oct 2026',
  by: 'Aline Uwase',
  summary:
  'In about 40% of scenario runs the hospital’s 24 isolation beds are not enough at the peak. Opening 8 annex beds lowers this to about 10% of runs.',
  figures: [
  { label: 'Chance beds run out (24 beds)', value: '40%', range: 'share of runs' },
  { label: 'Chance beds run out (32 beds)', value: '10%', range: 'share of runs' }]

},
{
  id: 'HR-009',
  title: 'Marburg health-worker risk brief',
  type: 'Scenario brief',
  period: 'October 2026',
  published: '01 Oct 2026',
  by: 'Dr. Sarah Icyeza',
  summary:
  'Earlier full protection for ward staff lowers the share of cases among health workers in most runs. Marburg values are provisional.',
  figures: [{ label: 'Health-worker share of cases', value: '31%', range: '18–52% (5–95%)' }]
}];