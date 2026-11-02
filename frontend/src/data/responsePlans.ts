import { ResponsePlan } from '../types/officer';

export const responsePlans: ResponsePlan[] = [
{
  id: 'PLN-07',
  title: 'Ebola isolation surge plan',
  disease: 'Ebola',
  status: 'Active',
  startDate: '2026-10-02',
  reviewDate: '2026-10-12',
  actions: [
  { name: 'Isolating sick people', target: 'Within 24 h of arrival' },
  { name: 'Extra isolation beds', target: '8 beds in annex ward' },
  { name: 'Tracing and watching contacts', target: '90 contacts daily' }],

  notes: 'Review if occupancy stays above 80% for three days.',
  updated: '2026-10-07'
},
{
  id: 'PLN-08',
  title: 'Marburg staff protection',
  disease: 'Marburg',
  status: 'Draft',
  startDate: '2026-10-09',
  reviewDate: '2026-10-16',
  actions: [
  { name: 'Protective equipment for health workers', target: '100% of ward staff' },
  { name: 'Screening at triage', target: 'All patients with fever' }],

  notes: '',
  updated: '2026-10-07'
}];