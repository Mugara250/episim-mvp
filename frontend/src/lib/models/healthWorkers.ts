import { Rng, binomial, toProb } from './random';

// Health-worker layer: a small sub-model attached to the SEIHFR hospital compartment.
// It is not a full agent-based model — it only tracks how many staff are still
// susceptible and how many get infected by the patients they care for.

export interface HcwSettings {
  /** Health workers caring for patients in the area. */
  pool: number;
  /** Protective equipment and infection control used correctly, before the outbreak is recognised (0–1). */
  ppeBefore: number;
  /** Same, after the outbreak is recognised (0–1). */
  ppeAfter: number;
  /** Day the outbreak is recognised and full protection starts. */
  recognitionDay: number;
}

export function protectionOn(day: number, s: HcwSettings) {
  return day < s.recognitionDay ? s.ppeBefore : s.ppeAfter;
}

/** New health-worker infections today. */
export function hcwInfections(
rng: Rng,
susceptibleStaff: number,
hospitalised: number,
day: number,
hcwRisk: number,
s: HcwSettings)
{
  if (susceptibleStaff <= 0 || hospitalised <= 0) return 0;
  const perWorkerRate = hcwRisk * (1 - protectionOn(day, s)) * hospitalised / Math.max(1, s.pool);
  return binomial(rng, susceptibleStaff, toProb(perWorkerRate));
}