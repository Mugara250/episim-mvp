import { districts } from '../data/geographic';
import { District, DistrictProjection, GeoCapacityProfile, GeoMetric, GeoScenario, MovementLink, RiskLevel } from '../types/geographic';

/** Bed-days per new case: ~60% admitted × ~8-day stay. */
const BED_FACTOR = 5;

export function projectDistrict(d: District, scenario: GeoScenario, capacity: GeoCapacityProfile, responseDay?: number): DistrictProjection {
  const H = scenario.horizon;
  const beds = Math.round(d.beds * capacity.bedMultiplier);
  const isSeed = d.id === scenario.seedDistrictId;
  const shift = isSeed ? 0 : scenario.arrivalShift;
  let arrival = d.arrival === null ? null : d.arrival + shift;
  if (arrival !== null && arrival > H) arrival = null;
  const peakDay = d.peakDay + shift;
  const peak = d.peakDaily * scenario.peakScale;

  const incidence: number[] = [];
  for (let t = 0; t <= H; t++) {
    if (arrival === null || t < arrival) {
      incidence.push(0);
      continue;
    }
    let v = peak * Math.exp(-(((t - peakDay) / d.width) ** 2));
    if (t === arrival) v += 1;
    if (responseDay !== undefined && t > responseDay) v *= Math.exp(-(t - responseDay) / 7);
    incidence.push(v);
  }
  const cumulative: number[] = [];
  incidence.reduce((acc, v) => {
    cumulative.push(acc + v);
    return acc + v;
  }, 0);
  const bedDemand = incidence.map((v) => v * BED_FACTOR);
  let peakIdx = 0;
  incidence.forEach((v, i) => {
    if (v > incidence[peakIdx]) peakIdx = i;
  });
  const overIdx = bedDemand.findIndex((b) => b > beds);
  return {
    district: d,
    beds,
    arrival,
    peakDay: peakIdx,
    peakDaily: incidence[peakIdx],
    incidence,
    cumulative,
    bedDemand,
    totalCases: cumulative[H],
    peakBedDemand: Math.max(...bedDemand),
    overCapacityDay: overIdx === -1 ? null : overIdx,
    overCapacityDays: bedDemand.filter((b) => b > beds).length
  };
}

export function projectSpread(scenario: GeoScenario, capacity: GeoCapacityProfile, responses: Record<string, number>) {
  return districts.map((d) => projectDistrict(d, scenario, capacity, responses[d.id]));
}

/** High = seed district or runs out of beds; Medium = reached within 50 days; Low otherwise. */
export function riskOf(p: DistrictProjection, seedId: string): RiskLevel {
  if (p.district.id === seedId || p.overCapacityDay !== null) return 'High';
  if (p.arrival !== null && p.arrival <= 50) return 'Medium';
  return 'Low';
}

/** The districts hit first (earliest projected case), ties broken by size of outbreak. */
export function topRiskDistricts(projections: DistrictProjection[], n = 5) {
  return projections.
  filter((p) => p.arrival !== null).
  sort((a, b) => (a.arrival as number) - (b.arrival as number) || b.totalCases - a.totalCases).
  slice(0, n);
}

// ── Movement (gravity model, static) ─────────────────────

function distanceKm(a: District, b: District) {
  const dx = (a.lng - b.lng) * 111;
  const dy = (a.lat - b.lat) * 111;
  return Math.sqrt(dx * dx + dy * dy);
}

export const strongestLinks: MovementLink[] = (() => {
  const links: MovementLink[] = [];
  districts.forEach((a, i) =>
  districts.slice(i + 1).forEach((b) => {
    const d = distanceKm(a, b);
    links.push({ a: a.id, b: b.id, trips: Math.round(2e-5 * a.population * b.population / (d * d + 100)) });
  })
  );
  return links.sort((x, y) => y.trips - x.trips).slice(0, 10);
})();

// ── Colour (single sequential emerald scale) ─────────────

export const SCALE = ['#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399', '#059669', '#065F46'];
export const NO_CASES = '#F8FAFC';

function bin(norm: number) {
  return SCALE[Math.min(SCALE.length - 1, Math.max(0, Math.floor(norm * SCALE.length)))];
}

export function cellFor(p: DistrictProjection, metric: GeoMetric, day: number, maxCases: number) {
  const cum = p.cumulative[day];
  if (cum < 1) return { fill: NO_CASES, label: '—', dark: false };
  let fill: string;
  let label: string;
  if (metric === 'cases') {
    fill = bin(Math.log10(cum) / Math.log10(maxCases));
    label = fmt(cum);
  } else {
    const ratio = p.bedDemand[day] / p.beds;
    fill = bin(ratio);
    label = `${Math.round(ratio * 100)}%`;
  }
  return { fill, label, dark: fill === SCALE[4] || fill === SCALE[5] };
}

export function legendFor(metric: GeoMetric, maxCases: number) {
  return metric === 'cases' ?
  { title: 'Projected cases', low: '1', high: fmt(maxCases) } :
  { title: 'Bed demand vs capacity', low: '0%', high: '100%+' };
}

export function fmt(n: number) {
  return Math.round(n).toLocaleString();
}