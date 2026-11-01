/**
 * Small-sample statistics for personal data: 95% intervals for means, rates and their
 * differences, and rank correlation. Honest about how little a few weeks can say, so
 * every comparison also carries an `Evidence` level instead of a bare number.
 */

/** An estimate with its 95% interval. */
export type Interval = { estimate: number; low: number; high: number };

/**
 * How much a comparison can say: too few observations to tell, an interval that still
 * includes no difference, or one that doesn't.
 */
export type Evidence = 'tooFew' | 'unclear' | 'clear';

/** Two-sided 95% t quantiles for 1–30 degrees of freedom; above that, the normal 1.96. */
const T95 = [
  12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131,
  2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042,
];
const Z95 = 1.96;
export const t95 = (df: number) => (df < 1 ? Infinity : (T95[Math.ceil(df) - 1] ?? Z95));

/** Fewest observations per side before a comparison is worth reading. */
export const MIN_PER_SIDE = 3;
/** Fewest pairs before a correlation is worth reading. */
export const MIN_PAIRS = 6;

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const variance = (xs: number[]) => {
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
};

/** A sample's mean with its t interval (none for fewer than two values). */
export type Sample = { n: number; mean: number | null; interval: Interval | null };

export function sample(xs: number[]): Sample {
  if (xs.length === 0) return { n: 0, mean: null, interval: null };
  const m = mean(xs);
  if (xs.length < 2) return { n: 1, mean: m, interval: null };
  const half = t95(xs.length - 1) * Math.sqrt(variance(xs) / xs.length);
  return { n: xs.length, mean: m, interval: { estimate: m, low: m - half, high: m + half } };
}

const evidenceOf = (interval: Interval | null, enough: boolean): Evidence =>
  !enough || !interval ? 'tooFew' : interval.low > 0 || interval.high < 0 ? 'clear' : 'unclear';

/** Two samples compared: a − b with Welch's interval, which doesn't assume equal spread. */
export type Comparison = { a: Sample; b: Sample; difference: Interval | null; evidence: Evidence };

export function compareMeans(a: number[], b: number[]): Comparison {
  const sa = sample(a);
  const sb = sample(b);
  let difference: Interval | null = null;
  if (a.length >= 2 && b.length >= 2) {
    const va = variance(a) / a.length;
    const vb = variance(b) / b.length;
    const se = Math.sqrt(va + vb);
    const d = sa.mean! - sb.mean!;
    // Welch–Satterthwaite degrees of freedom; with no spread at all, the difference is exact.
    const df = se === 0 ? Infinity : (va + vb) ** 2 / (va ** 2 / (a.length - 1) + vb ** 2 / (b.length - 1));
    const half = se === 0 ? 0 : t95(df) * se;
    difference = { estimate: d, low: d - half, high: d + half };
  }
  const enough = a.length >= MIN_PER_SIDE && b.length >= MIN_PER_SIDE;
  return { a: sa, b: sb, difference, evidence: evidenceOf(difference, enough) };
}

/** A rate, e.g. urges let pass out of urges, with Wilson's interval (sound for small n and 0% or 100%). */
export type Rate = { hits: number; n: number; interval: Interval | null };

export function rate(hits: number, n: number): Rate {
  if (n === 0) return { hits, n, interval: null };
  const p = hits / n;
  const z2 = Z95 ** 2;
  const centre = (p + z2 / (2 * n)) / (1 + z2 / n);
  const half = (Z95 * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
  return {
    hits,
    n,
    interval: { estimate: p, low: Math.max(0, centre - half), high: Math.min(1, centre + half) },
  };
}

/** Two rates compared: a − b with Newcombe's interval, built from each rate's Wilson interval. */
export type RateComparison = { a: Rate; b: Rate; difference: Interval | null; evidence: Evidence };

export function compareRates(a: Rate, b: Rate): RateComparison {
  let difference: Interval | null = null;
  if (a.interval && b.interval) {
    const [p1, l1, u1] = [a.interval.estimate, a.interval.low, a.interval.high];
    const [p2, l2, u2] = [b.interval.estimate, b.interval.low, b.interval.high];
    const d = p1 - p2;
    difference = {
      estimate: d,
      low: d - Math.sqrt((p1 - l1) ** 2 + (u2 - p2) ** 2),
      high: d + Math.sqrt((u1 - p1) ** 2 + (p2 - l2) ** 2),
    };
  }
  const enough = a.n >= MIN_PER_SIDE && b.n >= MIN_PER_SIDE;
  return { a, b, difference, evidence: evidenceOf(difference, enough) };
}

/** Ranks, ties sharing their average rank. */
function ranks(xs: number[]): number[] {
  const order = xs.map((x, i) => [x, i] as const).sort((p, q) => p[0] - q[0]);
  const result = new Array<number>(xs.length);
  for (let i = 0; i < order.length;) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    for (let k = i; k <= j; k++) result[order[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return result;
}

function pearson(xs: number[], ys: number[]): number | null {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxx === 0 || syy === 0 ? null : sxy / Math.sqrt(sxx * syy);
}

export type Point = { x: number; y: number };

/**
 * Spearman's rank correlation with a Fisher-z interval: does y tend to go up (ρ > 0)
 * or down (ρ < 0) as x goes up, whatever the shape? Null when either side never varies.
 */
export type Correlation = { n: number; rho: Interval | null; evidence: Evidence; points: Point[] };

export function correlation(points: Point[]): Correlation {
  const n = points.length;
  const r = n >= 3 ? pearson(ranks(points.map((p) => p.x)), ranks(points.map((p) => p.y))) : null;
  let rho: Interval | null = null;
  if (r !== null) {
    const clamped = Math.max(-0.9999, Math.min(0.9999, r));
    const z = Math.atanh(clamped);
    const se = n > 3 ? 1 / Math.sqrt(n - 3) : Infinity;
    rho = { estimate: r, low: Math.tanh(z - Z95 * se), high: Math.tanh(z + Z95 * se) };
  }
  return { n, rho, evidence: evidenceOf(rho, n >= MIN_PAIRS), points };
}
