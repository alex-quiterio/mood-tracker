import { addDays, lastNDays, localDate } from '@domain/shared/dates';
import { Mood } from '@domain/checkins/types';

import { DayUnlocks, UnlockWindow } from './dailyUnlocks';

/**
 * How many times a day adults unlock their phones, from 2025 studies that counted
 * true unlocks on the phone itself rather than asking people. All are US adults.
 *
 * Don't compare against pickup or screen-wake numbers (the often-quoted 110 to 190
 * a day, mostly from surveys and vendor reports): a pickup or wake counts every
 * time the screen lights up, unlocked or not, which is a different thing from the
 * KEYGUARD_HIDDEN unlocks this app counts.
 */
export const UNLOCK_BENCHMARKS = {
  /** The median used for reference, from the largest study. */
  median: 41,
  sources: [
    {
      name: 'PNAS 2025',
      detail: '10,099 US adults, Android API counts: median 41/day',
      url: 'https://www.pnas.org/doi/10.1073/pnas.2427311122',
    },
    {
      name: 'arXiv 2512.11905',
      detail: '233 US adults, mean age ~39: mean 39.3 ± 26.0/day',
      url: 'https://arxiv.org/abs/2512.11905',
    },
    {
      name: 'JMIR Mental Health 2025',
      detail: 'college students, phone records: ~39/day',
      url: null,
    },
  ],
} as const;

export type UnlockBand = 'low' | 'typical' | 'above' | 'heavy';

/** Upper bounds (inclusive) of each band, for a day's average rounded to a whole number. */
const BANDS: readonly [UnlockBand, number][] = [
  ['low', 24],
  ['typical', 55],
  ['above', 100],
  ['heavy', Infinity],
];

/** Under 25 low, 25 to 55 typical, 56 to 100 above typical, over 100 heavy. Banded on the rounded average, the number shown. */
export function unlockBand(averagePerDay: number): UnlockBand {
  const rounded = Math.round(averagePerDay);
  return BANDS.find(([, max]) => rounded <= max)![0];
}

/** Fewer complete days than this in the 7 and no band is shown. */
export const MIN_COMPLETE_DAYS = 5;

export type UnlockInsight =
  | { kind: 'notEnough'; completeDays: number }
  | {
      kind: 'band';
      average: number;
      band: UnlockBand;
      median: number;
      completeDays: number;
      /** How many of the complete days are estimates from check-in windows. */
      estimatedDays: number;
    };

/** The rolling 7-day average of complete days ending at `until`, and its band. */
export function unlockInsight(series: DayUnlocks[], until: string): UnlockInsight {
  const week = new Set(lastNDays(7, until));
  const complete = series.filter((d) => d.complete && week.has(d.date));
  if (complete.length < MIN_COMPLETE_DAYS) return { kind: 'notEnough', completeDays: complete.length };
  const average = complete.reduce((sum, d) => sum + d.unlocks, 0) / complete.length;
  return {
    kind: 'band',
    average,
    band: unlockBand(average),
    median: UNLOCK_BENCHMARKS.median,
    completeDays: complete.length,
    estimatedDays: complete.filter((d) => d.estimated).length,
  };
}

/** Check-ins needed in each mood group before the comparison shows. */
export const MIN_MOOD_ENTRIES = 5;

/** Daytime starts here; a window starting earlier has the night in it. */
const DAY_STARTS_AT_HOUR = 6;
/** Shorter windows give wild per-hour rates. */
const MIN_WINDOW_MS = 30 * 60 * 1000;

export type MoodGroupRate = { perHour: number; checkIns: number };
export type MoodUnlockPattern = { low: MoodGroupRate; high: MoodGroupRate };

const isDaytime = (w: UnlockWindow) => {
  const start = new Date(w.start);
  return (
    w.end - w.start >= MIN_WINDOW_MS &&
    start.getHours() >= DAY_STARTS_AT_HOUR &&
    localDate(start) === localDate(new Date(w.end)) &&
    localDate(start) === w.entry.date
  );
};

const groupRate = (windows: UnlockWindow[], moods: Mood[]): MoodGroupRate => {
  const group = windows.filter((w) => moods.includes(w.entry.mood));
  const hours = group.reduce((sum, w) => sum + (w.end - w.start) / 3_600_000, 0);
  const unlocks = group.reduce((sum, w) => sum + w.unlocks, 0);
  return { perHour: hours > 0 ? unlocks / hours : 0, checkIns: group.length };
};

/**
 * Unlocks per hour on low-mood check-ins (1 to 2) and good ones (4 to 5), over
 * daytime windows only: windows that cross midnight or start before 06:00 (most
 * morning check-ins) are left out, since sleep would dilute the rate. Null until
 * each group has `MIN_MOOD_ENTRIES` check-ins.
 */
export function moodUnlockPattern(windows: UnlockWindow[]): MoodUnlockPattern | null {
  const daytime = windows.filter(isDaytime);
  const low = groupRate(daytime, [1, 2]);
  const high = groupRate(daytime, [4, 5]);
  return low.checkIns >= MIN_MOOD_ENTRIES && high.checkIns >= MIN_MOOD_ENTRIES ? { low, high } : null;
}

/** The last day a rolling week can end on: yesterday for this week (today isn't over), else the week's last day. */
export const insightUntil = (shownUntil: string, today: string): string =>
  shownUntil < today ? shownUntil : addDays(today, -1);
