import { DiseaseId } from '../lib/models/diseases';

export interface CaseSeries {
  id: string;
  label: string;
  diseaseId: DiseaseId;
  reportedBy: string;
  startDate: string;
  counts: number[];
}

export const caseSeries: CaseSeries[] = [
{
  id: 'marburg-rwanda-2024',
  label: 'Marburg · Rwanda 2024 (reference)',
  diseaseId: 'marburg',
  reportedBy: 'National case line list · 66 cases',
  startDate: '2024-09-22',
  counts: [0, 1, 1, 2, 3, 5, 6, 8, 7, 6, 5, 4, 3, 4, 2, 2, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
  id: 'ebola-rubavu-exercise',
  label: 'Ebola · Rubavu district (exercise)',
  diseaseId: 'ebola',
  reportedBy: 'Health Officers · Gisenyi District Hospital, Nyundo HC',
  startDate: '2026-09-01',
  counts: [1, 0, 1, 2, 1, 3, 2, 4, 3, 5, 6, 5, 7, 8, 7, 9, 8, 7, 6, 6, 5, 4, 4, 3, 3, 2, 2, 1, 2, 1]
}];