import { lastChangedAt } from '@domain/checkins/entries';
import { Entry } from '@domain/checkins/types';
import { average } from '@domain/shared/math';
import { weekSoFar, weekStart } from '@domain/shared/dates';

import { Habit, HabitLog, activeHabits, inSweetSpot, periodTotal } from './habits';

/** Total doses of a habit per day, only for days where it was logged at least once. */
export function dosesByDay(entries: Entry[], habitId: string): Map<string, number> {
  const days = new Map<string, number>();
  for (const e of entries) {
    const dose = e.habits?.doses[habitId];
    if (dose) days.set(e.date, (days.get(e.date) ?? 0) + dose.count);
  }
  return days;
}

/**
 * Euros kept by having less than usual. Each logged day counts
 * (usual − actual) × price and never goes below zero: a heavier day saves
 * nothing, it doesn't take anything back.
 */
export function savings(entries: Entry[], habit: Habit, fromDate?: string, toDate?: string): number {
  if (!habit.pricePerDose || !habit.usualPerDay) return 0;
  let total = 0;
  for (const [date, count] of dosesByDay(entries, habit.id)) {
    if ((fromDate && date < fromDate) || (toDate && date > toDate)) continue;
    total += Math.max(0, habit.usualPerDay - count) * habit.pricePerDose;
  }
  return Math.round(total * 100) / 100;
}

/** What the doses cost: doses × price per dose, over the logged days in the range. */
export function spent(entries: Entry[], habit: Habit, fromDate?: string, toDate?: string): number {
  if (!habit.pricePerDose) return 0;
  let doses = 0;
  for (const [date, count] of dosesByDay(entries, habit.id)) {
    if ((fromDate && date < fromDate) || (toDate && date > toDate)) continue;
    doses += count;
  }
  return Math.round(doses * habit.pricePerDose * 100) / 100;
}

export const totalSpent = (entries: Entry[], habits: Habit[], fromDate?: string, toDate?: string) =>
  Math.round(
    habits.reduce((sum, h) => sum + (h.kind === 'reduce' ? spent(entries, h, fromDate, toDate) : 0), 0) * 100,
  ) / 100;

export const totalSavings = (entries: Entry[], habits: Habit[], fromDate?: string, toDate?: string) =>
  habits.reduce((sum, h) => sum + (h.kind === 'reduce' ? savings(entries, h, fromDate, toDate) : 0), 0);

export type HabitWeek = {
  habit: Habit;
  /** Check-ins this week that logged this habit; days, for habits to balance. */
  logged: number;
  /** Of those, how many had none (reduce), did it (grow) or were in the sweet spot (balance). */
  wins: number;
  total: number;
  saved: number;
  /** Average mood in check-ins with none vs some (reduce habits only). */
  moodWithNone: number | null;
  moodWithSome: number | null;
};

/** The latest "what you did instead" notes this week, most recently written first. */
export function recentInsteadNotes(entries: Entry[], today: string, count = 3): string[] {
  const days = new Set(weekSoFar(today));
  return entries
    .filter((e) => days.has(e.date) && e.habits?.instead)
    .sort((a, b) => (lastChangedAt(a) < lastChangedAt(b) ? 1 : -1))
    .slice(0, count)
    .map((e) => e.habits!.instead!);
}

/** This week's view (Monday to today) of each active habit, built to show what's going right. */
export function habitWeek(entries: Entry[], habits: Habit[], today: string): HabitWeek[] {
  const days = new Set(weekSoFar(today));
  const week = entries.filter((e) => days.has(e.date));
  return activeHabits(habits).map((habit) => {
    if (habit.kind === 'grow') {
      const logged = week.filter((e) => e.habits);
      const wins = logged.filter((e) => e.habits!.did.includes(habit.id)).length;
      return {
        habit,
        logged: logged.length,
        wins,
        total: wins,
        saved: 0,
        moodWithNone: null,
        moodWithSome: null,
      };
    }
    if (habit.kind === 'balance') {
      // All entries for the totals so far: a monthly sweet spot can start before Monday.
      const byDay = dosesByDay(entries, habit.id);
      const days = [...dosesByDay(week, habit.id)];
      return {
        habit,
        logged: days.length,
        wins: days.filter(([date, total]) => inSweetSpot(habit, total, periodTotal(habit, byDay, date)))
          .length,
        total: days.reduce((sum, [, total]) => sum + total, 0),
        saved: 0,
        moodWithNone: null,
        moodWithSome: null,
      };
    }
    const logged = week.filter((e) => e.habits?.doses[habit.id]);
    const none = logged.filter((e) => e.habits!.doses[habit.id].count === 0);
    const some = logged.filter((e) => e.habits!.doses[habit.id].count > 0);
    return {
      habit,
      logged: logged.length,
      wins: none.length,
      total: logged.reduce((sum, e) => sum + e.habits!.doses[habit.id].count, 0),
      saved: savings(entries, habit, weekStart(today), today),
      moodWithNone: average(none.map((e) => e.mood)),
      moodWithSome: average(some.map((e) => e.mood)),
    };
  });
}

/** A check-in's habits as short text, e.g. "🚬 2≈ · 🍺 0 · 💧 🚶". */
export function describeLog(log: HabitLog | undefined, habits: Habit[]): string {
  if (!log) return '';
  const byId = new Map(habits.map((h) => [h.id, h]));
  const doses = Object.entries(log.doses).map(
    ([id, d]) => `${byId.get(id)?.emoji ?? id} ${d.count}${d.approx ? '≈' : ''}`,
  );
  const did = log.did.map((id) => {
    const habit = byId.get(id);
    const picked = log.chosen?.[id]?.map((o) => habit?.options?.find((x) => x.id === o)?.emoji ?? o) ?? [];
    return [habit?.emoji ?? id, ...picked].join('');
  });
  return [...doses, ...(did.length ? [did.join(' ')] : [])].join(' · ');
}

/** Milestone amounts in euros; the UI names something real each could buy. */
export const SAVINGS_MILESTONES = [5, 12, 25, 50, 100, 150, 300, 600];

/** The biggest milestone reached, the next one to aim for, and progress toward it. */
export function savingsMilestone(amount: number) {
  const reached = [...SAVINGS_MILESTONES].reverse().find((a) => amount >= a) ?? null;
  const next = SAVINGS_MILESTONES.find((a) => amount < a) ?? null;
  return { reached, next, progress: next ? amount / next : 1 };
}
