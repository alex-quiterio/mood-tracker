import { weekSoFar } from '@domain/shared/dates';
import { average } from '@domain/shared/math';

import { Entry, MOODS, Mood } from './types';

/** Last night's sleep, logged with the morning check-in. Either part may be missing. */
export type Sleep = { quality?: Mood; hours?: number };

export const SLEEP_HOURS_STEP = 0.5;
export const SLEEP_HOURS_MAX = 14;
/** Where the hours stepper starts when nothing is logged yet. */
export const SLEEP_HOURS_START = 7.5;
/** A good night is at least this long, a short one under SHORT_NIGHT_HOURS. */
export const GOOD_NIGHT_HOURS = 7;
export const SHORT_NIGHT_HOURS = 6;

/** Rounds to the half-hour grid and keeps it within 0–14 hours. */
export const clampSleepHours = (hours: number) =>
  Math.min(SLEEP_HOURS_MAX, Math.max(0, Math.round(hours / SLEEP_HOURS_STEP) * SLEEP_HOURS_STEP));

/** A stored sleep log: undefined when empty, null when it isn't valid. */
export function parseSleep(value: unknown): Sleep | undefined | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.quality !== undefined && !MOODS.includes(v.quality as Mood)) return null;
  if (v.hours !== undefined && (typeof v.hours !== 'number' || !Number.isFinite(v.hours))) return null;
  const sleep: Sleep = {};
  if (v.quality !== undefined) sleep.quality = v.quality as Mood;
  if (v.hours !== undefined) sleep.hours = clampSleepHours(v.hours as number);
  return isEmptySleep(sleep) ? undefined : sleep;
}

export const isEmptySleep = (sleep: Sleep | undefined) =>
  !sleep || (sleep.quality === undefined && sleep.hours === undefined);

export const sameSleep = (a: Sleep | undefined, b: Sleep | undefined) =>
  (a?.quality ?? null) === (b?.quality ?? null) && (a?.hours ?? null) === (b?.hours ?? null);

export type SleepWeek = {
  nights: number;
  averageQuality: number | null;
  averageHours: number | null;
  /** The day's average mood after a good night (7h+) and after a short one (under 6h). */
  moodAfterGood: number | null;
  moodAfterShort: number | null;
};

/** Sleep this week (Monday to today), and how the days after good and short nights went. */
export function sleepWeek(entries: Entry[], today: string): SleepWeek {
  const days = new Set(weekSoFar(today));
  const nights = entries.filter((e) => days.has(e.date) && !isEmptySleep(e.sleep));
  const dayMood = (date: string) => average(entries.filter((e) => e.date === date).map((e) => e.mood));
  const moodsAfter = (keep: (hours: number) => boolean) =>
    average(
      nights
        .filter((e) => e.sleep!.hours !== undefined && keep(e.sleep!.hours))
        .flatMap((e) => {
          const mood = dayMood(e.date);
          return mood === null ? [] : [mood];
        }),
    );
  return {
    nights: nights.length,
    averageQuality: average(nights.flatMap((e) => (e.sleep!.quality ? [e.sleep!.quality] : []))),
    averageHours: average(nights.flatMap((e) => (e.sleep!.hours !== undefined ? [e.sleep!.hours] : []))),
    moodAfterGood: moodsAfter((h) => h >= GOOD_NIGHT_HOURS),
    moodAfterShort: moodsAfter((h) => h < SHORT_NIGHT_HOURS),
  };
}
