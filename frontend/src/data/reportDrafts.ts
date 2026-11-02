import { ReportDraft } from '../types/analyst';

export const reportDrafts: ReportDraft[] = [
{
  id: 'RPT-031',
  title: 'Ebola in Rubavu: effect of faster isolation',
  disease: 'Ebola',
  scenarioId: 'SCN-118',
  updated: '07 Oct 2026',
  status: 'Draft',
  summary:
  'Scenario estimates suggest isolating sick people within 3 days lowers the median outbreak size. The uncertainty range is wide, so results compare options rather than predict exact numbers.'
},
{
  id: 'RPT-030',
  title: 'Marburg: protecting health workers early',
  disease: 'Marburg',
  scenarioId: 'SCN-117',
  updated: '06 Oct 2026',
  status: 'Draft',
  summary:
  'In most runs, the share of cases among health workers falls when full protection starts earlier. Marburg parameters are provisional.'
},
{
  id: 'RPT-028',
  title: 'Ebola in Gasabo: isolation bed needs',
  disease: 'Ebola',
  scenarioId: 'SCN-112',
  updated: '01 Oct 2026',
  status: 'Pending approval',
  summary:
  'Across runs, peak isolation bed demand stays within current capacity in about two thirds of scenarios.'
},
{
  id: 'RPT-024',
  title: 'Weekly scenario brief · week 39',
  disease: 'Ebola',
  scenarioId: 'SCN-112',
  updated: '24 Sep 2026',
  status: 'Approved',
  approvedBy: 'Dr. Sarah Icyeza',
  summary: 'Summary of the week’s scenario runs and their uncertainty ranges.'
}];