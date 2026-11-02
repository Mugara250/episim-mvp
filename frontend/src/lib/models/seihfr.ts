import { DiseaseId, DiseaseProfile, getDisease } from './diseases';
import { makeRng, binomial, negBin, toProb, Rng } from './random';
import { bands, summarize, Band, Summary } from './stats';
import { hcwInfections, HcwSettings } from './healthWorkers';

// Stochastic SEIHFR (Legrand-style) model.
// S susceptible · E exposed · I infectious in the community · H in hospital
// F dead but not yet buried (funeral transmission) · R removed (recovered or safely buried).
// Every daily transition is a random draw, so each run is different.
// While an outbreak is still small (fewer than `branchingUntil` cases) new
// infections come from an overdispersed branching process, so chance decides
// whether it dies out or takes off.

export interface SimSettings extends HcwSettings {
  diseaseId: DiseaseId;
  r0: number;
  population: number;
  initialCases: number;
  days: number;
  runs: number;
  seed: number;
  isolationBeds: number;
  detectionDelay: number;
  safeBurial: number;
  contactTracing: number;
  isolation: number;
  branchingUntil: number;
}

export interface RunOutput {
  active: number[];
  hospitalised: number[];
  funerals: number[];
  cumulative: number[];
  deaths: number[];
  hcwCumulative: number[];
  communityCumulative: number[];
  finalCases: number;
  finalDeaths: number;
  hcwInfections: number;
  totalInfections: number;
  peakHospitalised: number;
}

export interface SimResult {
  settings: SimSettings;
  disease: DiseaseProfile;
  runs: RunOutput[];
  active: Band[];
  hospitalised: Band[];
  cumulative: Band[];
  deaths: Band[];
  hcwCumulative: Band[];
  communityCumulative: Band[];
  pTakeOff: number;
  pOver50: number;
  pOver100: number;
  pBedsExceeded: number;
  finalCases: Summary;
  finalDeaths: Summary;
  peakBeds: Summary;
  hcwShare: Summary;
}

/** How R0 is split between the three transmission routes when no action is taken. */
export const ROUTE_SHARE = { community: 0.55, hospital: 0.15, funeral: 0.3 };

export function defaultSettings(id: DiseaseId): SimSettings {
  const d = getDisease(id);
  return {
    diseaseId: id,
    r0: d.r0.likely,
    population: 403000,
    initialCases: id === 'ebola' ? 3 : 2,
    days: 180,
    runs: 200,
    seed: 2026,
    isolationBeds: 40,
    detectionDelay: d.onsetToAdmission,
    safeBurial: 0.5,
    contactTracing: 0.4,
    isolation: 0.5,
    branchingUntil: 20,
    pool: 600,
    ppeBefore: id === 'ebola' ? 0.3 : 0.2,
    ppeAfter: 0.85,
    recognitionDay: id === 'ebola' ? 14 : 21
  };
}

function runOnce(s: SimSettings, d: DiseaseProfile, rng: Rng): RunOutput {
  const baseDelay = d.onsetToAdmission;
  const hospStay = Math.max(
    2,
    d.cfrHospital * d.onsetToDeath + (1 - d.cfrHospital) * d.onsetToRecovery - baseDelay
  );
  const unsafeDeathsPerCase = (1 - d.hospitalised) * d.cfrCommunity + d.hospitalised * d.cfrHospital * 0.3;
  const betaI = s.r0 * ROUTE_SHARE.community / baseDelay * (1 - 0.6 * s.contactTracing);
  const betaH = s.r0 * ROUTE_SHARE.hospital / (d.hospitalised * hospStay) * (1 - 0.8 * s.isolation);
  const betaF = s.r0 * ROUTE_SHARE.funeral / (unsafeDeathsPerCase * d.burialDelay);

  let S = s.population - s.initialCases;
  let E = 0;
  let I = s.initialCases;
  let H = 0;
  let F = 0;
  let staff = s.pool;
  let cumCases = s.initialCases;
  let cumDeaths = 0;
  let hcwCum = 0;
  let infCum = s.initialCases;
  let peakH = 0;

  const out: RunOutput = {
    active: [],
    hospitalised: [],
    funerals: [],
    cumulative: [],
    deaths: [],
    hcwCumulative: [],
    communityCumulative: [],
    finalCases: 0,
    finalDeaths: 0,
    hcwInfections: 0,
    totalInfections: 0,
    peakHospitalised: 0
  };

  for (let day = 0; day <= s.days; day++) {
    out.active.push(I + H);
    out.hospitalised.push(H);
    out.funerals.push(F);
    out.cumulative.push(cumCases);
    out.deaths.push(cumDeaths);
    out.hcwCumulative.push(hcwCum);
    out.communityCumulative.push(infCum - hcwCum);
    peakH = Math.max(peakH, H);
    if (day === s.days) break;

    // 1. New infections in the community, hospital (visitors / other patients) and at funerals.
    const pressure = betaI * I + betaH * H + betaF * F;
    const newE =
    cumCases < s.branchingUntil ?
    Math.min(S, negBin(rng, pressure * S / s.population, d.k * Math.max(1, I + H + F))) :
    binomial(rng, S, toProb(pressure / s.population));
    // 2. Health-worker layer: staff infected by hospitalised patients.
    const newHcw = hcwInfections(rng, staff, H, day, d.hcwRisk, s);
    // 3. Progression.
    const becomeSick = binomial(rng, E, toProb(1 / d.incubation));
    const leaveCommunity = binomial(rng, I, toProb(1 / s.detectionDelay));
    const admitted = binomial(rng, leaveCommunity, d.hospitalised);
    const notAdmitted = leaveCommunity - admitted;
    const dieCommunity = binomial(rng, notAdmitted, d.cfrCommunity);
    const leaveHospital = binomial(rng, H, toProb(1 / hospStay));
    const dieHospital = binomial(rng, leaveHospital, d.cfrHospital);
    const unsafe =
    binomial(rng, dieCommunity, 1 - s.safeBurial) + binomial(rng, dieHospital, (1 - s.safeBurial) * 0.3);
    const buried = binomial(rng, F, toProb(1 / d.burialDelay));

    S -= newE;
    staff -= newHcw;
    E += newE + newHcw - becomeSick;
    I += becomeSick - leaveCommunity;
    H += admitted - leaveHospital;
    F += unsafe - buried;
    cumCases += becomeSick;
    cumDeaths += dieCommunity + dieHospital;
    hcwCum += newHcw;
    infCum += newE + newHcw;
  }

  out.finalCases = cumCases;
  out.finalDeaths = cumDeaths;
  out.hcwInfections = hcwCum;
  out.totalInfections = infCum;
  out.peakHospitalised = peakH;
  return out;
}

export function runSEIHFR(s: SimSettings): SimResult {
  const disease = getDisease(s.diseaseId);
  const rng = makeRng(s.seed);
  const runs = Array.from({ length: s.runs }, () => runOnce(s, disease, rng));
  const frac = (fn: (r: RunOutput) => boolean) => runs.filter(fn).length / runs.length;
  const sized = runs.filter((r) => r.totalInfections >= 10);

  return {
    settings: s,
    disease,
    runs,
    active: bands(runs.map((r) => r.active)),
    hospitalised: bands(runs.map((r) => r.hospitalised)),
    cumulative: bands(runs.map((r) => r.cumulative)),
    deaths: bands(runs.map((r) => r.deaths)),
    hcwCumulative: bands(runs.map((r) => r.hcwCumulative)),
    communityCumulative: bands(runs.map((r) => r.communityCumulative)),
    pTakeOff: frac((r) => r.finalCases >= s.branchingUntil),
    pOver50: frac((r) => r.finalCases > 50),
    pOver100: frac((r) => r.finalCases > 100),
    pBedsExceeded: frac((r) => r.peakHospitalised > s.isolationBeds),
    finalCases: summarize(runs.map((r) => r.finalCases)),
    finalDeaths: summarize(runs.map((r) => r.finalDeaths)),
    peakBeds: summarize(runs.map((r) => r.peakHospitalised)),
    hcwShare: summarize(sized.length ? sized.map((r) => r.hcwInfections / r.totalInfections) : [0])
  };
}