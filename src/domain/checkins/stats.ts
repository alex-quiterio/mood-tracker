import { addDays, lastNDays } from '@domain/shared/dates';
import { entryKey } from './entries';
import { Entry, SLOTS, Slot } from './types';

export type DayRow = {
  date: string;
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

const average = (values: number[]) =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

/** Stats for the 7 days ending at `today` (inclusive). */
export function weeklyStats(entries: Entry[], today?: string): WeeklyStats {
  const byKey = new Map(entries.map((e) => [entryKey(e.date, e.slot), e]));
  const days: DayRow[] = lastNDays(7, today).map((date) => ({
    date,
    entries: {
      morning: byKey.get(entryKey(date, 'morning')),
      afternoon: byKey.get(entryKey(date, 'afternoon')),
      evening: byKey.get(entryKey(date, 'evening')),
    },
  }));

  const weekEntries = days
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
    days,
    slotAverages,
    overallAverage: average(weekEntries.map((e) => e.mood)),
    unlockAverage: average(valuesOf(weekEntries, 'unlocks')),
    slotUnlockAverages: perSlot('unlocks'),
    stepAverage: average(valuesOf(weekEntries, 'steps')),
    slotStepAverages: perSlot('steps'),
    logged: weekEntries.length,
    possible: days.length * SLOTS.length,
  };
}

export const formatAverage = (value: number | null) => (value === null ? '–' : value.toFixed(1));

/**
 * Consecutive days with at least one check-in, ending today. A day without a
 * check-in yet today doesn't break the streak until it's over.
 */
export function currentStreak(entries: Entry[], today: string): number {
  const logged = new Set(entries.map((e) => e.date));
  let day = logged.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (logged.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}
