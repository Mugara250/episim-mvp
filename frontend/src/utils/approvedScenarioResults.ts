import { approvedScenarios } from '../data/approvedScenarios';
import { SimResult, defaultSettings, runSEIHFR } from '../lib/models/seihfr';
import { ApprovedScenario } from '../types/policy';

const cache = new Map<string, SimResult>();

/** Runs an approved scenario once (fixed seed) and reuses the result everywhere. */
export function resultFor(s: ApprovedScenario): SimResult {
  const hit = cache.get(s.id);
  if (hit) return hit;
  const base = defaultSettings(s.diseaseId);
  const result = runSEIHFR({
    ...base,
    runs: 150,
    days: 180,
    seed: 4041,
    detectionDelay: s.detectionDelay,
    safeBurial: s.safeBurial,
    contactTracing: s.contactTracing,
    isolationBeds: s.isolationBeds,
    ppeAfter: s.ppeAfter ?? base.ppeAfter,
    recognitionDay: s.recognitionDay ?? base.recognitionDay
  });
  cache.set(s.id, result);
  return result;
}

export function scenarioById(id: string) {
  return approvedScenarios.find((s) => s.id === id);
}

const r = (v: number) => Math.round(v).toLocaleString();

export function casesRange(res: SimResult) {
  return `${r(res.finalCases.low)} to ${r(res.finalCases.high)}`;
}

export function bedsRange(res: SimResult) {
  return `${r(res.peakBeds.low)} to ${r(res.peakBeds.high)}`;
}

function inTen(p: number) {
  const n = Math.round(p * 10);
  if (n <= 0) return 'fewer than 1 in 10';
  if (n >= 10) return 'almost all';
  return `about ${n} in 10`;
}

/** Plain-language summary of a scenario result. */
export function plainSummary(s: ApprovedScenario, res: SimResult) {
  const parts = [
  `If this plan is followed, the outbreak is likely to reach ${casesRange(res)} cases in total over six months.`,
  `At the busiest point, ${bedsRange(res)} isolation beds may be needed, compared with ${s.isolationBeds} available.`,
  `Beds run short in ${inTen(res.pBedsExceeded)} scenario runs.`];

  if (s.diseaseId === 'marburg') parts.push('Marburg figures are still provisional.');
  return parts.join(' ');
}

export { inTen };