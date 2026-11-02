export type ProvinceId = 'kigali' | 'northern' | 'southern' | 'eastern' | 'western';

export interface District {
  id: string;
  name: string;
  province: ProvinceId;
  population: number;
  /** Isolation / treatment beds in the base capacity profile. */
  beds: number;
  lat: number;
  lng: number;
  /** Tile-grid position (8 columns × 6 rows). */
  col: number;
  row: number;
  /** Illustrative spread inputs for the sample run. */
  arrival: number | null;
  peakDay: number;
  width: number;
  peakDaily: number;
}

export type BorderCountry = 'DRC' | 'Uganda' | 'Burundi' | 'Tanzania';
export type RiskLevel = 'High' | 'Medium' | 'Low';
export type GeoMetric = 'cases' | 'beds';

export interface BorderRisk {
  country: BorderCountry;
  risk: RiskLevel;
}

export interface GeoScenario {
  id: string;
  name: string;
  disease: 'Ebola' | 'Marburg';
  seedDistrictId: string;
  horizon: number;
  runs: number;
  peakScale: number;
  arrivalShift: number;
  illustrative: boolean;
}

export interface GeoCapacityProfile {
  id: string;
  name: string;
  bedMultiplier: number;
}

export interface DistrictProjection {
  district: District;
  beds: number;
  arrival: number | null;
  peakDay: number;
  peakDaily: number;
  incidence: number[];
  cumulative: number[];
  bedDemand: number[];
  totalCases: number;
  peakBedDemand: number;
  overCapacityDay: number | null;
  overCapacityDays: number;
}

export interface MovementLink {
  a: string;
  b: string;
  trips: number;
}