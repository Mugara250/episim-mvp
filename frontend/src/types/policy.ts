import { DiseaseId } from '../lib/models/diseases';

export interface ApprovedScenario {
  id: string;
  name: string;
  diseaseId: DiseaseId;
  /** One plain sentence describing what the plan does. */
  plan: string;
  approvedBy: string;
  approvedOn: string;
  detectionDelay: number;
  safeBurial: number;
  contactTracing: number;
  isolationBeds: number;
  ppeAfter?: number;
  recognitionDay?: number;
}

export interface PolicyAlert {
  id: string;
  level: 'high' | 'medium' | 'info';
  title: string;
  detail: string;
  date: string;
}

export interface ApprovedReport {
  id: string;
  title: string;
  disease: 'Ebola' | 'Marburg';
  type: string;
  approvedBy: string;
  approvedOn: string;
  author: string;
  summary: string;
  keyPoints: string[];
  figures: {label: string;range: string;}[];
  recommendations: string[];
}

export interface InterventionReview {
  id: string;
  name: string;
  disease: 'Ebola' | 'Marburg' | 'Both';
  description: string;
  effect: string;
  effectRange: string;
  cost: 'Low' | 'Medium' | 'High';
  status: 'Recommended' | 'Under review' | 'Not recommended';
  basis: string;
}