// Seeded random helpers for the stochastic models.
// A fixed seed makes each run reproducible, so the same settings give the same answer.

export type Rng = () => number;

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function normal(rng: Rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function poisson(rng: Rng, lambda: number): number {
  if (lambda <= 0) return 0;
  if (lambda < 30) {
    const limit = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= rng();
    } while (p > limit);
    return k - 1;
  }
  return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * normal(rng)));
}

export function binomial(rng: Rng, n: number, p: number): number {
  if (n <= 0 || p <= 0) return 0;
  if (p >= 1) return n;
  if (n < 40) {
    let x = 0;
    for (let i = 0; i < n; i++) if (rng() < p) x++;
    return x;
  }
  const mean = n * p;
  if (mean < 10) return Math.min(n, poisson(rng, mean));
  const sd = Math.sqrt(mean * (1 - p));
  return Math.min(n, Math.max(0, Math.round(mean + sd * normal(rng))));
}

export function gamma(rng: Rng, shape: number, scale: number): number {
  if (shape < 1) {
    return gamma(rng, shape + 1, scale) * Math.pow(rng(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x = 0;
    let v = 0;
    do {
      x = normal(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x ** 4) return d * v * scale;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * scale;
  }
}

/** Negative binomial with a given mean and dispersion k (small k = more superspreading). */
export function negBin(rng: Rng, mean: number, k: number): number {
  if (mean <= 0) return 0;
  return poisson(rng, gamma(rng, Math.max(k, 0.001), mean / Math.max(k, 0.001)));
}

/** Daily rate → probability that the event happens within one day. */
export const toProb = (rate: number) => 1 - Math.exp(-Math.max(0, rate));