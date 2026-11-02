import { ApprovedReport } from '../types/policy';

// Approved reports only. Drafts and pending reports never reach decision makers.
export const approvedReports: ApprovedReport[] = [
{
  id: 'APR-014',
  title: 'Weekly situation report · week 40',
  disease: 'Ebola',
  type: 'Weekly situation',
  approvedBy: 'Dr. Sarah Icyeza',
  approvedOn: '06 Oct 2026',
  author: 'Aline Uwase',
  summary:
  'Ebola cases in Rubavu are still rising. If nothing changes, the outbreak is likely to keep growing for several weeks, and isolation beds may run short.',
  keyPoints: [
  'Each sick person is currently infecting more than one other person.',
  'Isolation beds at the district hospital are close to full.',
  'Finding and isolating sick people faster makes the biggest difference.'],

  figures: [
  { label: 'Possible total cases over 6 months', range: '40 to 260 cases' },
  { label: 'Isolation beds needed at the busiest point', range: '12 to 45 beds' }],

  recommendations: [
  'Fund extra isolation beds in Rubavu now.',
  'Support faster testing so sick people are isolated within 3 days.']

},
{
  id: 'APR-013',
  title: 'Effect of faster isolation on Ebola',
  disease: 'Ebola',
  type: 'Scenario brief',
  approvedBy: 'Dr. Sarah Icyeza',
  approvedOn: '04 Oct 2026',
  author: 'Aline Uwase',
  summary:
  'Isolating sick people within 3 days instead of 7 lowers the likely number of cases in most scenario runs.',
  keyPoints: ['Speed of isolation matters more than any single other action.', 'Results are estimates, not exact predictions.'],
  figures: [
  { label: 'Cases with isolation within 3 days', range: 'about half as many as with 7 days' }],

  recommendations: ['Set a national target of isolation within 3 days of symptoms.']
},
{
  id: 'APR-011',
  title: 'Marburg: protecting health workers',
  disease: 'Marburg',
  type: 'Scenario brief',
  approvedBy: 'Dr. Sarah Icyeza',
  approvedOn: '01 Oct 2026',
  author: 'Aline Uwase',
  summary:
  'In 2024, most Marburg cases in Rwanda were health workers. Giving staff full protection early lowers how many of them are infected.',
  keyPoints: ['Health workers face the highest risk early in an outbreak.', 'Marburg figures are still provisional.'],
  figures: [{ label: 'Share of cases among health workers', range: '18% to 52%' }],
  recommendations: ['Keep protective equipment stocked at all referral hospitals.']
},
{
  id: 'APR-008',
  title: 'Isolation capacity across Western Province',
  disease: 'Ebola',
  type: 'Capacity review',
  approvedBy: 'Dr. Sarah Icyeza',
  approvedOn: '24 Sep 2026',
  author: 'Aline Uwase',
  summary: 'Current isolation capacity may not be enough in about 4 in 10 scenario runs.',
  keyPoints: ['Opening 8 extra beds lowers this to about 1 in 10 runs.'],
  figures: [{ label: 'Chance beds run short', range: '1 in 10 to 4 in 10 runs' }],
  recommendations: ['Prepare annex wards that can open within 48 hours.']
}];