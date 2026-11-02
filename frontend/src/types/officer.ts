export type OfficerDisease = 'Ebola' | 'Marburg';

export type PpeLevel = 'Good' | 'Low' | 'Critical';

/** One day of counts for one disease at the officer's hospital. Counts only — never patient details. */
export interface HospitalEntry {
  id: string;
  date: string; // ISO yyyy-mm-dd
  disease: OfficerDisease;
  suspected: number;
  confirmed: number;
  inIsolation: number;
  recovered: number;
  deaths: number;
  hcwInfected: number;
  /** Isolation beds for the whole hospital. */
  bedsTotal: number;
  bedsOccupied: number;
  ppeStock: PpeLevel;
  trainedStaff: number;
  burialTeamReady: boolean;
  contactsFollowUp: number;
  /** Seeded sample record, not entered by a user. */
  illustrative?: boolean;
}

export type InstructionStatus = 'Not started' | 'In progress' | 'Done' | "Can't do";

export interface Instruction {
  id: string;
  action: string;
  target: string;
  deadline: string; // ISO
  from: string;
  disease: OfficerDisease;
  received: string;
  status: InstructionStatus;
  reason?: string;
  illustrative?: boolean;
}

export interface PlanAction {
  name: string;
  target: string;
}

export type PlanStatus = 'Draft' | 'Active';

export interface ResponsePlan {
  id: string;
  title: string;
  disease: OfficerDisease;
  status: PlanStatus;
  startDate: string;
  reviewDate: string;
  actions: PlanAction[];
  notes: string;
  updated: string;
  illustrative?: boolean;
}

export interface HospitalReport {
  id: string;
  title: string;
  type: 'Weekly situation' | 'Scenario brief' | 'Capacity review';
  period: string;
  published: string;
  by: string;
  summary: string;
  figures: {label: string;value: string;range: string;}[];
  illustrative?: boolean;
  /** Server-supplied honesty line printed on every report. */
  estimateNote?: string;
  exports?: unknown[];
}