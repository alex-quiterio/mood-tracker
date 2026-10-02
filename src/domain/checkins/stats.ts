import { addDays, lastNDays, localDate, weekOf } from '@domain/shared/dates';
import { average } from '@domain/shared/math';
import { entryKey } from './entries';
import { Entry, SLOTS, Slot } from './types';

export type DayRow = {
  date: string;
  /** A day of the week still to come: shown, but not counted as missed. */
  future: boolean;
  entries: Record<Slot, Entry | undefined>;
};

export type WeeklyStats = {
  days: DayRow[];
  slotAverages: Record<Slot, number | null>;
  overallAverage: number | null;
  /** Average phone unlocks per check-in, over the check-ins that have a count. */
  unlockAverage: number | null;
  slotUnlockAverages: Record<Slot, number | null>;
  /** Average steps per check-in, over the check-ins that have a count. */
  stepAverage: number | null;
  slotStepAverages: Record<Slot, number | null>;
  logged: number;
  possible: number;
};

/** The Monday-to-Sunday week `today` falls in, for the This week tab. */
export const thisWeekStats = (entries: Entry[], today: string = localDate()) =>
  weeklyStats(entries, today, weekOf(today));

/**
 * Stats over `days`: by default the 7 days ending at `today` (inclusive). Days after
 * `today` are marked future and not counted as possible check-ins.
 */
export function weeklyStats(
  entries: Entry[],
  today: string = localDate(),
  days: string[] = lastNDays(7, today),
): WeeklyStats {
  const byKey = new Map(entries.map((e) => [entryKey(e.date, e.slot), e]));
  const rows: DayRow[] = days.map((date) => ({
    date,
    future: date > today,
    entries: {
      morning: byKey.get(entryKey(date, 'morning')),
      afternoon: byKey.get(entryKey(date, 'afternoon')),
      evening: byKey.get(entryKey(date, 'evening')),
    },
  }));

  const weekEntries = rows
    .flatMap((d) => SLOTS.map((s) => d.entries[s]))
    .filter((e): e is Entry => e !== undefined);

  const slotAverages = Object.fromEntries(
    SLOTS.map((slot) => [slot, average(weekEntries.filter((e) => e.slot === slot).map((e) => e.mood))]),
  ) as Record<Slot, number | null>;

  const valuesOf = (list: Entry[], key: 'unlocks' | 'steps') =>
    list.flatMap((e) => (e[key] === undefined ? [] : [e[key]]));
  const perSlot = (key: 'unlocks' | 'steps') =>
    Object.fromEntries(
      SLOTS.map((slot) => [
        slot,
        average(
          valuesOf(
            weekEntries.filter((e) => e.slot === slot),
            key,
          ),
        ),
      ]),
    ) as Record<Slot, number | null>;

  return {
    days: rows,
    slotAverages,
    overallAverage: average(weekEntries.map((e) => e.mood)),
    unlockAverage: average(valuesOf(weekEntries, 'unlocks')),
    slotUnlockAverages: perSlot('unlocks'),
    stepAverage: average(valuesOf(weekEntries, 'steps')),
    slotStepAverages: perSlot('steps'),
    logged: weekEntries.length,
    possible: rows.filter((d) => !d.future).length * SLOTS.length,
  };
}

/** How far one missed day must be from the last one to count as a rest day. */
export const REST_DAY_EVERY = 7;

export type StreakHistory = {
  /** Days with a check-in in the current run; rest days aren't counted. */
  current: number;
  /** How many times any run reached a full week (7, 14, 21… days with a check-in). */
  weeks: number;
};

/**
 * Streaks that forgive: one missed day a week is a rest day and keeps the run going,
 * as long as the next day has a check-in. Two days missed in a row, or a second miss
 * within a week, start over. Today isn't missed until it's over.
 */
export function streakHistory(entries: Entry[], today: string): StreakHistory {
  const logged = new Set(entries.map((e) => e.date));
  const first = [...logged].sort()[0];
  if (!first) return { current: 0, weeks: 0 };
  let run = 0;
  let weeks = 0;
  let lastRest: string | null = null;
  for (let day = first; day <= today; day = addDays(day, 1)) {
    if (logged.has(day)) {
      run++;
      if (run % REST_DAY_EVERY === 0) weeks++;
      continue;
    }
    if (day === today) continue;
    const next = addDays(day, 1);
    const canRest =
      run > 0 &&
      (logged.has(next) || next === today) &&
      (lastRest === null || addDays(lastRest, REST_DAY_EVERY) <= day);
    if (canRest) {
      lastRest = day;
    } else {
      run = 0;
      lastRest = null;
    }
  }
  return { current: run, weeks };
}

/** Days with a check-in in the current streak, rest days forgiven. */
export const currentStreak = (entries: Entry[], today: string): number =>
  streakHistory(entries, today).current;
