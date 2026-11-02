import { ScenarioRecord } from '../types/analyst';

export const analystScenarios: ScenarioRecord[] = [
{ id: 'SCN-118', name: 'Ebola Rubavu · isolation within 3 days', disease: 'Ebola', date: '07 Oct 2026', status: 'Completed', thisWeek: true },
{ id: 'SCN-117', name: 'Marburg Kigali · health-worker protection 85%', disease: 'Marburg', date: '06 Oct 2026', status: 'Completed', thisWeek: true },
{ id: 'SCN-116', name: 'Ebola Rubavu · 80% safe burials', disease: 'Ebola', date: '06 Oct 2026', status: 'Running', thisWeek: true },
{ id: 'SCN-115', name: 'Marburg Kigali · current response', disease: 'Marburg', date: '05 Oct 2026', status: 'Saved', thisWeek: true },
{ id: 'SCN-112', name: 'Ebola Gasabo · bed stress test', disease: 'Ebola', date: '29 Sep 2026', status: 'Completed', thisWeek: false }];