// Rt estimation (Cori et al. 2013): uses daily case counts and the serial
// interval to estimate how many people each case is infecting right now.

export interface RtPoint {
  day: number;
  cases: number;
  rt: number | null;
  low: number | null;
  high: number | null;
}

export type Trend = 'growing' | 'shrinking' | 'uncertain' | 'not-enough-data';

/** Serial interval as daily weights (discretised gamma), index 0 unused. */
export function serialWeights(mean: number, sd: number, maxDays = 60) {
  const shape = (mean / sd) ** 2;
  const scale = sd * sd / mean;
  const raw = [0];
  for (let s = 1; s <= maxDays; s++) raw.push(Math.pow(s, shape - 1) * Math.exp(-s / scale));
  const total = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / total);
}

/** Wilson–Hilferty approximation of a gamma quantile. */
function gammaQuantile(shape: number, rate: number, z: number) {
  const v = 1 - 1 / (9 * shape) + z * Math.sqrt(1 / (9 * shape));
  return shape * Math.max(0, v) ** 3 / rate;
}

export function estimateRt(
cases: number[],
si: {mean: number;sd: number;},
window = 7,
priorMean = 5,
priorSd = 5)
: RtPoint[] {
  const w = serialWeights(si.mean, si.sd);
  const a = (priorMean / priorSd) ** 2;
  const b = priorSd * priorSd / priorMean;
  const lambda = cases.map((_, t) => {
    let sum = 0;
    for (let s = 1; s <= t && s < w.length; s++) sum += cases[t - s] * w[s];
    return sum;
  });
  return cases.map((c, t) => {
    if (t < window) return { day: t, cases: c, rt: null, low: null, high: null };
    let sumI = 0;
    let sumL = 0;
    for (let j = t - window + 1; j <= t; j++) {
      sumI += cases[j];
      sumL += lambda[j];
    }
    if (sumL < 1) return { day: t, cases: c, rt: null, low: null, high: null };
    const shape = a + sumI;
    const rate = 1 / b + sumL;
    return {
      day: t,
      cases: c,
      rt: shape / rate,
      low: gammaQuantile(shape, rate, -1.96),
      high: gammaQuantile(shape, rate, 1.96)
    };
  });
}

export function trendOf(point: RtPoint | undefined): Trend {
  if (!point || point.rt === null || point.low === null || point.high === null) return 'not-enough-data';
  if (point.low > 1) return 'growing';
  if (point.high < 1) return 'shrinking';
  return 'uncertain';
}