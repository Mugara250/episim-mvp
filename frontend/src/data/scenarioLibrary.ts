import { Role } from '../lib/rbac';
import { PopulationDataset, Scenario } from '../types/scenarios';

/** Institution of each demo user, used for "Share with my institution". */
export const USER_INSTITUTIONS: Record<Role, string> = {
  admin: 'Rwanda Biomedical Centre',
  analyst: 'Rwanda Biomedical Centre',
  officer: 'Gisenyi District Hospital',
  policymaker: 'Ministry of Health'
};

export const SHARE_INSTITUTIONS = [
'Rwanda Biomedical Centre',
'Ministry of Health',
'University of Rwanda',
'Gisenyi District Hospital',
'Kibagabaga District Hospital',
'Ruhengeri Referral Hospital'];


export const COLLEAGUES = [
{ name: 'Aline Uwase', role: 'Epidemiologist', institution: 'Rwanda Biomedical Centre' },
{ name: 'Dr. Sarah Icyeza', role: 'Epidemiologist', institution: 'Rwanda Biomedical Centre' },
{ name: 'Dr. Eric Habimana', role: 'Epidemiologist', institution: 'University of Rwanda' },
{ name: 'Dr. Robert K.', role: 'Public Health Officer', institution: 'Gisenyi District Hospital' },
{ name: 'Grace Mukamana', role: 'Public Health Officer', institution: 'Kibagabaga District Hospital' },
{ name: 'Hon. Minister', role: 'Policy Maker', institution: 'Ministry of Health' },
{ name: 'Diane Ingabire', role: 'Policy Maker', institution: 'Ministry of Health' }];


// Population totals are illustrative placeholders.
export const populationDatasets: PopulationDataset[] = [
{
  id: 'ds-rphc5',
  name: 'Rwanda RPHC5 2022',
  coverage: 'Rwanda · all 30 districts',
  source: 'NISR Census (10% sample)',
  population: 13246394,
  version: 2,
  lastImported: '03 Oct 2026'
},
{
  id: 'ds-kigali',
  name: 'Kigali City 2022',
  coverage: 'City of Kigali · 3 districts, 35 sectors',
  source: 'NISR Census',
  population: 1745555,
  version: 1,
  lastImported: '12 Mar 2026'
},
{
  id: 'ds-rubavu',
  name: 'Rubavu District 2022',
  coverage: 'Western Province · Rubavu, 12 sectors',
  source: 'NISR Census',
  population: 546683,
  version: 1,
  lastImported: '18 Aug 2026'
},
{
  id: 'ds-gasabo',
  name: 'Gasabo sectors 2022',
  coverage: 'City of Kigali · Gasabo, 15 sectors',
  source: 'NISR Census (aggregated counts)',
  population: 879505,
  version: 3,
  lastImported: '21 Sep 2026'
}];


export const scenarioSeed: Scenario[] = [
{
  id: 'SC-1048',
  name: 'Marburg Rubavu · contact tracing + safe burials',
  description: 'How far tracing and safe burials keep a Marburg outbreak near the border in check.',
  datasetId: 'ds-rubavu',
  datasetVersion: 1,
  presetId: 'marburg',
  packageId: 'pkg-tracing-burials',
  owner: 'Aline Uwase',
  ownerInstitution: 'Rwanda Biomedical Centre',
  created: '07 Oct 2026',
  draft: false,
  shares: [
  { id: 'sh8', kind: 'institution', target: 'Ministry of Health', permission: 'view' },
  { id: 'sh9', kind: 'institution', target: 'Gisenyi District Hospital', permission: 'clone' }]

},
{
  id: 'SC-1042',
  name: 'Ebola Rubavu · contact tracing + isolation',
  description: 'Tests whether early tracing and isolation keep a Rubavu outbreak small.',
  datasetId: 'ds-rubavu',
  datasetVersion: 1,
  presetId: 'ebola-zaire',
  packageId: 'pkg-tracing-isolation',
  owner: 'Aline Uwase',
  ownerInstitution: 'Rwanda Biomedical Centre',
  created: '06 Oct 2026',
  draft: false,
  shares: [
  { id: 'sh1', kind: 'institution', target: 'Rwanda Biomedical Centre', permission: 'clone' },
  { id: 'sh2', kind: 'institution', target: 'Ministry of Health', permission: 'view' }]

},
{
  id: 'SC-1039',
  name: 'Marburg Kigali · no response',
  description: 'Baseline with no interventions, for comparison.',
  datasetId: 'ds-kigali',
  datasetVersion: 1,
  presetId: 'marburg',
  packageId: null,
  owner: 'Aline Uwase',
  ownerInstitution: 'Rwanda Biomedical Centre',
  created: '02 Oct 2026',
  draft: false,
  shares: []
},
{
  id: 'SC-1031',
  name: 'Ebola national · ring vaccination',
  description: '',
  datasetId: 'ds-rphc5',
  datasetVersion: 1,
  presetId: 'ebola-zaire',
  packageId: 'pkg-ring-vaccination',
  owner: 'Aline Uwase',
  ownerInstitution: 'Rwanda Biomedical Centre',
  created: '24 Sep 2026',
  draft: false,
  shares: [
  { id: 'sh3', kind: 'user', target: 'Hon. Minister', permission: 'clone' },
  { id: 'sh4', kind: 'user', target: 'Dr. Robert K.', permission: 'view' }]

},
{
  id: 'SC-1046',
  name: 'Marburg Gasabo · lockdown test',
  description: '',
  datasetId: 'ds-gasabo',
  datasetVersion: 3,
  presetId: 'marburg-rw-2024',
  packageId: null,
  owner: 'Aline Uwase',
  ownerInstitution: 'Rwanda Biomedical Centre',
  created: '08 Oct 2026',
  draft: true,
  shares: []
},
{
  id: 'SC-1037',
  name: 'Marburg 2024 calibration · tracing',
  description: 'Checks the Rwanda 2024 calibrated preset against tracing and isolation.',
  datasetId: 'ds-kigali',
  datasetVersion: 1,
  presetId: 'marburg-rw-2024',
  packageId: 'pkg-tracing-isolation',
  owner: 'Dr. Eric Habimana',
  ownerInstitution: 'University of Rwanda',
  created: '30 Sep 2026',
  draft: false,
  shares: [{ id: 'sh5', kind: 'institution', target: 'Rwanda Biomedical Centre', permission: 'view' }]
},
{
  id: 'SC-1044',
  name: 'Gisenyi catchment · Ebola surge',
  description: 'Local surge scenario for the Gisenyi catchment area.',
  datasetId: 'ds-rubavu',
  datasetVersion: 1,
  presetId: 'ebola-zaire',
  packageId: 'pkg-tracing-isolation',
  owner: 'Dr. Robert K.',
  ownerInstitution: 'Gisenyi District Hospital',
  created: '07 Oct 2026',
  draft: false,
  shares: [{ id: 'sh6', kind: 'user', target: 'Aline Uwase', permission: 'clone' }]
},
{
  id: 'SC-1028',
  name: 'Ebola Kigali · lockdown + masking',
  description: '',
  datasetId: 'ds-kigali',
  datasetVersion: 1,
  presetId: 'ebola-zaire',
  packageId: 'pkg-lockdown-masking',
  owner: 'Dr. Sarah Icyeza',
  ownerInstitution: 'Rwanda Biomedical Centre',
  created: '19 Sep 2026',
  draft: false,
  shares: [{ id: 'sh7', kind: 'institution', target: 'Ministry of Health', permission: 'clone' }]
}];