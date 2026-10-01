import { lastNDays } from './dates';
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

  const weekEntries = days.flatMap((d) => SLOTS.map((s) => d.entries[s])).filter(
    (e): e is Entry => e !== undefined,
  );

  const slotAverages = Object.fromEntries(
    SLOTS.map((slot) => [slot, average(weekEntries.filter((e) => e.slot === slot).map((e) => e.mood))]),
  ) as Record<Slot, number | null>;

  return {
    days,
    slotAverages,
    overallAverage: average(weekEntries.map((e) => e.mood)),
    unlockAverage: average(weekEntries.flatMap((e) => (e.unlocks === undefined ? [] : [e.unlocks]))),
    logged: weekEntries.length,
    possible: days.length * SLOTS.length,
  };
}

export const formatAverage = (value: number | null) => (value === null ? '–' : value.toFixed(1));
