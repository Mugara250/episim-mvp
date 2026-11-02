// Generates distribution-level reference outputs from the original TypeScript engine.
// Run from the repo root:  node tools/reference-engine/generate.ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { defaultSettings, runSEIHFR } from './src/seihfr.ts';
import { estimateRt } from './src/rt.ts';
import { quantile } from './src/stats.ts';
import { getDisease } from './src/diseases.ts';

const OUT = 'backend/tests/simulation/reference';
const SEEDS = [2026, 11, 42, 777, 9001];
const DAYS = [30, 60, 90, 120, 180];
mkdirSync(OUT, { recursive: true });

const summ = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b);
  return { low: quantile(s, 0.05), median: quantile(s, 0.5), high: quantile(s, 0.95), mean: v.reduce((a, b) => a + b, 0) / v.length };
};

for (const id of ['ebola', 'marburg'] as const) {
  const runs = SEEDS.flatMap((seed) => runSEIHFR({ ...defaultSettings(id), seed }).runs);
  const settings = defaultSettings(id);
  const frac = (fn: (r: (typeof runs)[number]) => boolean) => runs.filter(fn).length / runs.length;
  const atDays = (key: 'cumulative' | 'active' | 'hospitalised' | 'deaths') =>
    Object.fromEntries(DAYS.map((d) => [d, summ(runs.map((r) => r[key][d]))]));
  const out = {
    provenance: 'frontend/src/lib/models (TypeScript prototype engine), defaultSettings, seeds ' + SEEDS.join(','),
    disease: id,
    settings,
    nRuns: runs.length,
    pTakeOff: frac((r) => r.finalCases >= settings.branchingUntil),
    pOver50: frac((r) => r.finalCases > 50),
    pOver100: frac((r) => r.finalCases > 100),
    pBedsExceeded: frac((r) => r.peakHospitalised > settings.isolationBeds),
    finalCases: summ(runs.map((r) => r.finalCases)),
    finalDeaths: summ(runs.map((r) => r.finalDeaths)),
    peakHospitalised: summ(runs.map((r) => r.peakHospitalised)),
    hcwInfections: summ(runs.map((r) => r.hcwInfections)),
    cumulativeAt: atDays('cumulative'),
    activeAt: atDays('active'),
    hospitalisedAt: atDays('hospitalised'),
    deathsAt: atDays('deaths')
  };
  writeFileSync(`${OUT}/${id}.json`, JSON.stringify(out, null, 2));
  console.log(id, 'pTakeOff', out.pTakeOff, 'finalCases median', out.finalCases.median);
}

// Rt check values: fixed case series, both diseases' serial intervals.
const cases = [1, 0, 2, 1, 3, 2, 4, 5, 3, 6, 8, 7, 9, 12, 10, 14, 13, 18, 16, 20, 22, 19, 25, 24, 28, 30, 27, 33, 31, 35];
const rt = Object.fromEntries(
  (['ebola', 'marburg'] as const).map((id) => [id, estimateRt(cases, getDisease(id).serialInterval, 7)])
);
writeFileSync(`${OUT}/rt.json`, JSON.stringify({ cases, window: 7, rt }, null, 2));
console.log('rt written');
