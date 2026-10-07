import type { Slot } from '@domain/checkins/types';
import { addDays, isValidDate, localDate, slotForTime } from '@domain/shared/dates';

import { MAX_DOSES, type HabitLog } from './habits';

/**
 * An urge to do a habit to reduce, and what happened after the pause. Letting it
 * pass is a win (light points); having one is simply noted, with no blame and no
 * points taken away. It does set a minimum for that habit's doses in the check-in
 * of the same time of day, so the count stays honest.
 */

export type UrgeOutcome = 'passed' | 'gaveIn';

/** What was felt just before the urge. Any number can be picked, or none. */
export const URGE_FEELINGS = [
  'restlessness',
  'boredom',
  'sadness',
  'emptiness',
  'habit',
  'loneliness',
  'fear',
  'anxiety',
  'anger',
  'hopelessness',
  'tiredness',
  'shame',
] as const;

export type UrgeFeeling = (typeof URGE_FEELINGS)[number];

export type Urge = {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  habitId: string;
  outcome: UrgeOutcome;
  /** What was felt before the urge; left out when none was picked (and on urges saved before 1.14). */
  feelings?: UrgeFeeling[];
  /** ISO 8601 timestamp; with the habit it identifies the urge. */
  recordedAt: string;
};

/** Light points for an urge that passed: like a zero, plus the effort of the pause. */
export const URGE_POINTS = 2;

/** The pause before choosing: 12 calm breaths of 10 seconds. */
export const URGE_BREATHS = 12;

export const addUrge = (urges: Urge[], urge: Urge): Urge[] => mergeUrges(urges, [urge]);

/** Adds urges that aren't known yet, oldest first. */
export function mergeUrges(existing: Urge[], incoming: Urge[]): Urge[] {
  const byKey = new Map<string, Urge>();
  for (const u of [...existing, ...incoming]) byKey.set(`${u.recordedAt}|${u.habitId}`, u);
  return [...byKey.values()].sort((a, b) => (a.recordedAt < b.recordedAt ? -1 : 1));
}

export const passedOn = (urges: Urge[], date: string) =>
  urges.filter((u) => u.date === date && u.outcome === 'passed').length;

export function parseUrge(value: unknown): Urge | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (!isValidDate(v.date)) return null;
  if (typeof v.habitId !== 'string' || v.habitId === '') return null;
  if (v.outcome !== 'passed' && v.outcome !== 'gaveIn') return null;
  if (typeof v.recordedAt !== 'string' || Number.isNaN(Date.parse(v.recordedAt))) return null;
  const feelings = Array.isArray(v.feelings)
    ? URGE_FEELINGS.filter((f) => (v.feelings as unknown[]).includes(f))
    : [];
  return {
    date: v.date,
    habitId: v.habitId,
    outcome: v.outcome,
    ...(feelings.length > 0 ? { feelings } : {}),
    recordedAt: v.recordedAt,
  };
}

/** Adds or removes a feeling, keeping them in the order of URGE_FEELINGS. */
export const toggleFeeling = (feelings: UrgeFeeling[], feeling: UrgeFeeling): UrgeFeeling[] =>
  URGE_FEELINGS.filter((f) => (f === feeling ? !feelings.includes(f) : feelings.includes(f)));

/** How often each feeling came before an urge between two dates (inclusive), most frequent first. */
export function feelingsBefore(
  urges: Urge[],
  fromDate: string,
  toDate: string,
): { feeling: UrgeFeeling; count: number }[] {
  const counts = new Map<UrgeFeeling, number>();
  for (const u of urges) {
    if (u.date < fromDate || u.date > toDate) continue;
    for (const f of u.feelings ?? []) counts.set(f, (counts.get(f) ?? 0) + 1);
  }
  return URGE_FEELINGS.filter((f) => counts.has(f))
    .map((feeling) => ({ feeling, count: counts.get(feeling)! }))
    .sort((a, b) => b.count - a.count);
}

/** Stored urges; anything that isn't valid is dropped. */
export const parseUrges = (value: unknown): Urge[] =>
  Array.isArray(value) ? value.map(parseUrge).filter((u): u is Urge => u !== null) : [];

/** Doses per habit that can't be logged lower: each urge that took the best of you, in that slot. */
export function urgeFloors(urges: Urge[], date: string, slot: Slot): Record<string, number> {
  const floors: Record<string, number> = {};
  for (const u of urges) {
    if (u.date !== date || u.outcome !== 'gaveIn' || slotForTime(new Date(u.recordedAt)) !== slot) continue;
    floors[u.habitId] = Math.min(MAX_DOSES, (floors[u.habitId] ?? 0) + 1);
  }
  return floors;
}

/** Raises doses to their floors, logging habits that weren't logged yet. */
export function applyUrgeFloors(log: HabitLog, floors: Record<string, number>): HabitLog {
  const doses = { ...log.doses };
  for (const [id, floor] of Object.entries(floors)) {
    if ((doses[id]?.count ?? 0) < floor) doses[id] = { ...doses[id], count: floor };
  }
  return { ...log, doses };
}

/** How far back the urge forecast looks, and how many urges at an hour make a pattern. */
export const FORECAST_DAYS = 28;
export const FORECAST_MIN_URGES = 3;
/** The day is split into windows of this many hours. */
const FORECAST_WINDOW_HOURS = 3;

export type UrgeForecast = {
  /** Local hours, the window `now` falls in: [fromHour, toHour). */
  fromHour: number;
  toHour: number;
  /** Urges in that window over the last FORECAST_DAYS. */
  count: number;
  /** The feeling that most often came before them, if any was named. */
  feeling: UrgeFeeling | null;
};

/**
 * A heads-up when urges have tended to come at this time of day, so the next one
 * can be met prepared rather than surprised. Null when there's no pattern yet.
 */
export function urgeForecast(urges: Urge[], now: Date = new Date()): UrgeForecast | null {
  const today = localDate(now);
  const from = addDays(today, -(FORECAST_DAYS - 1));
  const fromHour = Math.floor(now.getHours() / FORECAST_WINDOW_HOURS) * FORECAST_WINDOW_HOURS;
  const toHour = fromHour + FORECAST_WINDOW_HOURS;
  const matching = urges.filter((u) => {
    const hour = new Date(u.recordedAt).getHours();
    return u.date >= from && u.date <= today && hour >= fromHour && hour < toHour;
  });
  if (matching.length < FORECAST_MIN_URGES) return null;
  return {
    fromHour,
    toHour,
    count: matching.length,
    feeling: feelingsBefore(matching, from, today)[0]?.feeling ?? null,
  };
}
