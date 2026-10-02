import { average } from '@domain/shared/math';
import { lastNDays, parseLocalDate } from '@domain/shared/dates';
import { Habit, activeHabits } from '@domain/habits/habits';

import { Entry, SLOTS, Slot } from './types';

export const MONTH_DAYS = 30;
/** A weekday or slot needs this many check-ins before it's called best or hardest. */
const MIN_SAMPLES = 2;

export type Extreme = { average: number };
export type MonthReview = {
  days: string[];
  logged: number;
  possible: number;
  overallAverage: number | null;
  /** Weekday (0 = Sunday … 6 = Saturday) with the highest and lowest average mood; null without enough data. */
  bestWeekday: (Extreme & { weekday: number }) | null;
  hardestWeekday: (Extreme & { weekday: number }) | null;
  slotAverages: Record<Slot, number | null>;
  lowestSlot: (Extreme & { slot: Slot }) | null;
  /** For each habit to reduce: average mood on days with none logged vs some. */
  habitMoods: { habit: Habit; none: number; some: number }[];
};

/** Simple patterns over the last 30 days, built to be read kindly (what helps, not what fails). */
export function monthReview(entries: Entry[], habits: Habit[], today: string): MonthReview {
  const days = lastNDays(MONTH_DAYS, today);
  const inMonth = new Set(days);
  const month = entries.filter((e) => inMonth.has(e.date));

  const byWeekday = new Map<number, number[]>();
  for (const e of month) {
    const weekday = parseLocalDate(e.date).getDay();
    byWeekday.set(weekday, [...(byWeekday.get(weekday) ?? []), e.mood]);
  }
  const weekdays = [...byWeekday]
    .filter(([, moods]) => moods.length >= MIN_SAMPLES)
    .map(([weekday, moods]) => ({ weekday, average: average(moods)! }))
    .sort((a, b) => b.average - a.average || a.weekday - b.weekday);
  const spread = weekdays.length >= 2 && weekdays[0].average !== weekdays[weekdays.length - 1].average;

  const slotAverages = Object.fromEntries(
    SLOTS.map((slot) => [slot, average(month.filter((e) => e.slot === slot).map((e) => e.mood))]),
  ) as Record<Slot, number | null>;
  const slots = SLOTS.filter((s) => month.filter((e) => e.slot === s).length >= MIN_SAMPLES)
    .map((slot) => ({ slot, average: slotAverages[slot]! }))
    .sort((a, b) => a.average - b.average);
  const slotSpread = slots.length >= 2 && slots[0].average !== slots[slots.length - 1].average;

  return {
    days,
    logged: month.length,
    possible: days.length * SLOTS.length,
    overallAverage: average(month.map((e) => e.mood)),
    bestWeekday: spread ? weekdays[0] : null,
    hardestWeekday: spread ? weekdays[weekdays.length - 1] : null,
    slotAverages,
    lowestSlot: slotSpread ? slots[0] : null,
    habitMoods: activeHabits(habits, 'reduce').flatMap((habit) => {
      const none = moodOnDays(month, habit.id, (count) => count === 0);
      const some = moodOnDays(month, habit.id, (count) => count > 0);
      return none !== null && some !== null ? [{ habit, none, some }] : [];
    }),
  };
}

/** Average of each matching day's average mood; a day counts by its total doses of the habit. */
function moodOnDays(entries: Entry[], habitId: string, matches: (doses: number) => boolean): number | null {
  const days = new Map<string, { doses: number; moods: number[] }>();
  for (const e of entries) {
    const dose = e.habits?.doses[habitId];
    if (!dose) continue;
    const day = days.get(e.date) ?? { doses: 0, moods: [] };
    days.set(e.date, { doses: day.doses + dose.count, moods: [...day.moods, e.mood] });
  }
  return average([...days.values()].filter((d) => matches(d.doses)).map((d) => average(d.moods)!));
}
