export type ViewMode =
'admin_overview' |
'disease_specific' |
'district_focus' |
'strategic_priority' |
'scenario_comparison';

export interface DashboardContext {
  disease: string;
  location: string;
  timeRange: string;
}