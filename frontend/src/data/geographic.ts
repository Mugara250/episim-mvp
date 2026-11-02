import { BorderRisk, District, GeoCapacityProfile, GeoScenario, ProvinceId } from '../types/geographic';

// Illustrative sample data: an Ebola scenario seeded in Rubavu. Populations approximate the 2022 census;
// beds and spread inputs are placeholders for design review.
export const districts: District[] = [
// Kigali City
{ id: 'gasabo', name: 'Gasabo', province: 'kigali', population: 879505, beds: 60, lat: -1.89, lng: 30.11, col: 5, row: 1, arrival: 18, peakDay: 45, width: 14, peakDaily: 24 },
{ id: 'kicukiro', name: 'Kicukiro', province: 'kigali', population: 491731, beds: 40, lat: -2.0, lng: 30.13, col: 5, row: 2, arrival: 24, peakDay: 52, width: 14, peakDaily: 9.6 },
{ id: 'nyarugenge', name: 'Nyarugenge', province: 'kigali', population: 374319, beds: 45, lat: -1.97, lng: 30.04, col: 4, row: 2, arrival: 22, peakDay: 50, width: 14, peakDaily: 12.6 },
// Northern
{ id: 'burera', name: 'Burera', province: 'northern', population: 387729, beds: 15, lat: -1.47, lng: 29.83, col: 4, row: 0, arrival: 30, peakDay: 58, width: 13, peakDaily: 2 },
{ id: 'gakenke', name: 'Gakenke', province: 'northern', population: 352421, beds: 15, lat: -1.68, lng: 29.78, col: 3, row: 1, arrival: 31, peakDay: 59, width: 13, peakDaily: 1.8 },
{ id: 'gicumbi', name: 'Gicumbi', province: 'northern', population: 448824, beds: 20, lat: -1.58, lng: 30.07, col: 5, row: 0, arrival: 42, peakDay: 70, width: 13, peakDaily: 2.4 },
{ id: 'musanze', name: 'Musanze', province: 'northern', population: 476522, beds: 40, lat: -1.5, lng: 29.6, col: 3, row: 0, arrival: 16, peakDay: 40, width: 12, peakDaily: 9.6 },
{ id: 'rulindo', name: 'Rulindo', province: 'northern', population: 350933, beds: 15, lat: -1.73, lng: 29.99, col: 4, row: 1, arrival: 34, peakDay: 62, width: 13, peakDaily: 2 },
// Southern
{ id: 'gisagara', name: 'Gisagara', province: 'southern', population: 397051, beds: 15, lat: -2.6, lng: 29.83, col: 3, row: 5, arrival: 72, peakDay: 98, width: 13, peakDaily: 1.6 },
{ id: 'huye', name: 'Huye', province: 'southern', population: 381900, beds: 25, lat: -2.6, lng: 29.74, col: 2, row: 5, arrival: 50, peakDay: 78, width: 13, peakDaily: 2.8 },
{ id: 'kamonyi', name: 'Kamonyi', province: 'southern', population: 450849, beds: 20, lat: -2.0, lng: 29.9, col: 3, row: 3, arrival: 32, peakDay: 60, width: 13, peakDaily: 3.2 },
{ id: 'muhanga', name: 'Muhanga', province: 'southern', population: 358433, beds: 25, lat: -2.08, lng: 29.75, col: 3, row: 2, arrival: 36, peakDay: 64, width: 13, peakDaily: 3 },
{ id: 'nyamagabe', name: 'Nyamagabe', province: 'southern', population: 372906, beds: 15, lat: -2.47, lng: 29.47, col: 1, row: 4, arrival: 56, peakDay: 84, width: 13, peakDaily: 1.8 },
{ id: 'nyanza', name: 'Nyanza', province: 'southern', population: 365718, beds: 15, lat: -2.35, lng: 29.75, col: 2, row: 4, arrival: 52, peakDay: 80, width: 13, peakDaily: 1.9 },
{ id: 'nyaruguru', name: 'Nyaruguru', province: 'southern', population: 318126, beds: 15, lat: -2.7, lng: 29.53, col: 1, row: 5, arrival: 96, peakDay: 120, width: 13, peakDaily: 1 },
{ id: 'ruhango', name: 'Ruhango', province: 'southern', population: 359121, beds: 15, lat: -2.22, lng: 29.78, col: 2, row: 3, arrival: 46, peakDay: 74, width: 13, peakDaily: 2.2 },
// Eastern
{ id: 'bugesera', name: 'Bugesera', province: 'eastern', population: 551103, beds: 25, lat: -2.23, lng: 30.15, col: 5, row: 3, arrival: 38, peakDay: 66, width: 13, peakDaily: 3.6 },
{ id: 'gatsibo', name: 'Gatsibo', province: 'eastern', population: 551255, beds: 20, lat: -1.58, lng: 30.45, col: 6, row: 1, arrival: 60, peakDay: 88, width: 13, peakDaily: 2.4 },
{ id: 'kayonza', name: 'Kayonza', province: 'eastern', population: 457156, beds: 20, lat: -1.9, lng: 30.5, col: 7, row: 2, arrival: 54, peakDay: 82, width: 13, peakDaily: 2.2 },
{ id: 'kirehe', name: 'Kirehe', province: 'eastern', population: 460860, beds: 15, lat: -2.27, lng: 30.65, col: 7, row: 3, arrival: 78, peakDay: 104, width: 13, peakDaily: 1.4 },
{ id: 'ngoma', name: 'Ngoma', province: 'eastern', population: 404048, beds: 15, lat: -2.17, lng: 30.47, col: 6, row: 3, arrival: 64, peakDay: 92, width: 13, peakDaily: 1.8 },
{ id: 'nyagatare', name: 'Nyagatare', province: 'eastern', population: 653861, beds: 25, lat: -1.3, lng: 30.33, col: 6, row: 0, arrival: 68, peakDay: 96, width: 13, peakDaily: 2.6 },
{ id: 'rwamagana', name: 'Rwamagana', province: 'eastern', population: 484953, beds: 25, lat: -1.95, lng: 30.43, col: 6, row: 2, arrival: 40, peakDay: 68, width: 13, peakDaily: 3.4 },
// Western
{ id: 'karongi', name: 'Karongi', province: 'western', population: 369039, beds: 20, lat: -2.07, lng: 29.4, col: 1, row: 3, arrival: 27, peakDay: 54, width: 13, peakDaily: 2.8 },
{ id: 'ngororero', name: 'Ngororero', province: 'western', population: 367955, beds: 15, lat: -1.87, lng: 29.53, col: 2, row: 2, arrival: 26, peakDay: 53, width: 13, peakDaily: 2.2 },
{ id: 'nyabihu', name: 'Nyabihu', province: 'western', population: 319047, beds: 20, lat: -1.65, lng: 29.51, col: 2, row: 1, arrival: 10, peakDay: 34, width: 12, peakDaily: 3.5 },
{ id: 'nyamasheke', name: 'Nyamasheke', province: 'western', population: 434852, beds: 20, lat: -2.33, lng: 29.1, col: 0, row: 3, arrival: 28, peakDay: 55, width: 13, peakDaily: 2.6 },
{ id: 'rubavu', name: 'Rubavu', province: 'western', population: 546683, beds: 70, lat: -1.68, lng: 29.34, col: 1, row: 1, arrival: 0, peakDay: 26, width: 13, peakDaily: 12 },
{ id: 'rusizi', name: 'Rusizi', province: 'western', population: 485529, beds: 35, lat: -2.48, lng: 28.9, col: 0, row: 4, arrival: 14, peakDay: 38, width: 12, peakDaily: 7.7 },
{ id: 'rutsiro', name: 'Rutsiro', province: 'western', population: 369180, beds: 15, lat: -1.93, lng: 29.33, col: 1, row: 2, arrival: 20, peakDay: 46, width: 13, peakDaily: 2.6 }];


/** Province name and an empty grid cell where its label sits. */
export const PROVINCES: Record<ProvinceId, {name: string;label: {col: number;row: number;};}> = {
  northern: { name: 'Northern', label: { col: 2, row: 0 } },
  western: { name: 'Western', label: { col: 0, row: 2 } },
  kigali: { name: 'Kigali City', label: { col: 4, row: 3 } },
  eastern: { name: 'Eastern', label: { col: 7, row: 1 } },
  southern: { name: 'Southern', label: { col: 3, row: 4 } }
};

export const borderRisks: BorderRisk[] = [
{ country: 'DRC', risk: 'High' },
{ country: 'Uganda', risk: 'Medium' },
{ country: 'Burundi', risk: 'Low' },
{ country: 'Tanzania', risk: 'Low' }];


export const geoScenarios: GeoScenario[] = [
{ id: 'RUN-0142', name: 'Ebola · Rubavu seed · Baseline', disease: 'Ebola', seedDistrictId: 'rubavu', horizon: 120, runs: 200, peakScale: 1, arrivalShift: 0, illustrative: true },
{ id: 'RUN-0145', name: 'Ebola · Rubavu seed · Early isolation', disease: 'Ebola', seedDistrictId: 'rubavu', horizon: 120, runs: 200, peakScale: 0.72, arrivalShift: 4, illustrative: true }];


export const geoCapacityProfiles: GeoCapacityProfile[] = [
{ id: 'moh-q3', name: 'MoH isolation beds · Q3 2026', bedMultiplier: 1 },
{ id: 'surge', name: 'Surge plan · +40% beds', bedMultiplier: 1.4 }];


export const MOBILITY_NOTE =
'Estimated with a gravity model from district population (2022 census) and distance. It is not observed travel data.';