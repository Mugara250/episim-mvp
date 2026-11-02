import { InterventionPackage, InterventionType } from '../types/interventions';
import { DiseasePreset } from '../types/presets';
import { RunSummary } from '../types/simulationRuns';

// Simple deterministic SEIHFR model for the run summary tiles.
// All structural constants are illustrative placeholders.
const P_HOSPITAL = 0.4; // share of cases admitted to hospital
const HOSPITAL_DAYS = 5;
const FUNERAL_DAYS = 2;
const HOSPITAL_SPREAD = 0.4; // relative to community spread
const FUNERAL_SPREAD = 1.5;

interface RouteEffects {
  community: number;
  hospital: number;
  funeral: number;
  /** Share of susceptible people protected per day */
  vaccinate: number;
}

function effectsAt(day: number, horizon: number, pkg: InterventionPackage | undefined, types: InterventionType[]): RouteEffects {
  const fx: RouteEffects = { community: 1, hospital: 1, funeral: 1, vaccinate: 0 };
  if (!pkg) return fx;
  for (const item of pkg.items) {
    const end = item.endDay ?? horizon;
    if (day < item.startDay || day > end) continue;
    const type = types.find((t) => t.id === item.typeId);
    if (!type) continue;
    const r = item.coverage * (item.customEffect ?? type.defaultEffect);
    if (type.mechanism === 'shift') {
      fx.vaccinate += r / Math.max(end - item.startDay, 1);
      continue;
    }
    if (type.key.includes('burial')) fx.funeral *= 1 - r;else
    if (type.key.includes('isolation')) {
      fx.community *= 1 - r;
      fx.hospital *= 1 - r * 0.5;
    } else if (type.key === 'masking') {
      fx.community *= 1 - r;
      fx.hospital *= 1 - r;
    } else fx.community *= 1 - r;
  }
  return fx;
}

interface SeihfrInput {
  population: number;
  preset: DiseasePreset;
  pkg: InterventionPackage | undefined;
  types: InterventionType[];
  horizonDays: number;
  initialCases: number;
}

export function runSeihfr({ population, preset, pkg, types, horizonDays, initialCases }: SeihfrInput): RunSummary {
  const m = preset.mortality;
  const beta =
  preset.r0 / (
  preset.infectiousDays + P_HOSPITAL * HOSPITAL_DAYS * HOSPITAL_SPREAD + (1 - P_HOSPITAL) * m * FUNERAL_DAYS * FUNERAL_SPREAD);
  const sigma = 1 / preset.incubationDays;
  const gamma = 1 / preset.infectiousDays;
  const dt = 0.25;

  let S = population - initialCases;
  let E = 0;
  let I = initialCases;
  let H = 0;
  let F = 0;
  let recovered = 0;
  let dead = 0;
  let peak = I;
  let peakDay = 0;

  for (let step = 1; step <= horizonDays / dt; step++) {
    const t = step * dt;
    const fx = effectsAt(t, horizonDays, pkg, types);
    const force = beta * (fx.community * I + HOSPITAL_SPREAD * fx.hospital * H + FUNERAL_SPREAD * fx.funeral * F);
    const infected = Math.min(S, force * S * dt / population);
    const vaccinated = Math.min(S - infected, fx.vaccinate * S * dt);
    const eOut = sigma * E * dt;
    const iOut = gamma * I * dt;
    const hOut = H / HOSPITAL_DAYS * dt;
    const fOut = F / FUNERAL_DAYS * dt;

    S -= infected + vaccinated;
    E += infected - eOut;
    I += eOut - iOut;
    H += P_HOSPITAL * iOut - hOut;
    F += (1 - P_HOSPITAL) * m * iOut - fOut;
    recovered += (1 - P_HOSPITAL) * (1 - m) * iOut + hOut * (1 - m);
    dead += fOut + hOut * m;

    const infectious = I + H + F;
    if (infectious > peak) {
      peak = infectious;
      peakDay = t;
    }
  }

  return {
    peakInfectious: Math.round(peak),
    peakDay: Math.round(peakDay),
    deaths: Math.round(dead + F),
    recovered: Math.round(recovered)
  };
}