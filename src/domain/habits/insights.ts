import { Entry } from '@domain/checkins/types';
import { formatEuros } from '@domain/i18n/format';
import { Locale } from '@domain/i18n/locale';
import { messages } from '@domain/i18n/messages';
import { addDays, lastNDays } from '@domain/shared/dates';

import { Habit, HabitLog, activeHabits } from './habits';

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

export const totalSavings = (entries: Entry[], habits: Habit[], fromDate?: string, toDate?: string) =>
  habits.reduce((sum, h) => sum + (h.kind === 'reduce' ? savings(entries, h, fromDate, toDate) : 0), 0);

/** Amounts of the milestones; each locale names something real they could buy. */
export const SAVINGS_MILESTONES = [5, 12, 25, 50, 100, 150, 300, 600];

/** The biggest milestone reached and the next one to aim for. */
export function savingsMilestone(amount: number, locale: Locale = 'en') {
  const labels = messages(locale).savings.milestones;
  const toMilestone = (a: number | undefined) => (a === undefined ? null : { amount: a, label: labels[a] });
  const reached = toMilestone([...SAVINGS_MILESTONES].reverse().find((a) => amount >= a));
  const next = toMilestone(SAVINGS_MILESTONES.find((a) => amount < a));
  return { reached, next, progress: next ? amount / next.amount : 1 };
}

export { formatEuros };

export type HabitWeek = {
  habit: Habit;
  /** Check-ins this week that logged this habit. */
  logged: number;
  /** Of those, how many had none (reduce) or did it (grow). */
  wins: number;
  total: number;
  saved: number;
  /** Average mood in check-ins with none vs some (reduce habits only). */
  moodWithNone: number | null;
  moodWithSome: number | null;
};

const average = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** This week's view of each active habit, built to show what's going right. */
export function habitWeek(entries: Entry[], habits: Habit[], today: string): HabitWeek[] {
  const days = new Set(lastNDays(7, today));
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
    const logged = week.filter((e) => e.habits?.doses[habit.id]);
    const none = logged.filter((e) => e.habits!.doses[habit.id].count === 0);
    const some = logged.filter((e) => e.habits!.doses[habit.id].count > 0);
    return {
      habit,
      logged: logged.length,
      wins: none.length,
      total: logged.reduce((sum, e) => sum + e.habits!.doses[habit.id].count, 0),
      saved: savings(entries, habit, addDays(today, -6), today),
      moodWithNone: average(none.map((e) => e.mood)),
      moodWithSome: average(some.map((e) => e.mood)),
    };
  });
}

/** One line per habit for a week, phrased around what went right. */
export function describeHabitWeek(w: HabitWeek, locale: Locale = 'en'): string {
  const { habit } = w;
  const m = messages(locale).habits;
  if (w.logged === 0) return m.notLoggedThisWeek(habit.emoji, habit.name);
  if (habit.kind === 'grow') return m.growWeek(habit.emoji, habit.name, w.wins, w.logged);
  return m.reduceWeek(habit.emoji, w.wins, w.logged, w.total, habit.unit);
}

/** One habit's week for the Claude prompt, in plain words. */
export function promptHabitWeek(w: HabitWeek, locale: Locale = 'en'): string {
  const { habit } = w;
  const m = messages(locale).prompt;
  if (habit.kind === 'grow') return m.habitGrow(habit.name, w.wins, w.logged);
  return m.habitReduce(habit.name, w.wins, w.logged, w.total, habit.unit);
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

/** Habit lines for the Claude prompt. */
export function promptHabitText(log: HabitLog | undefined, habits: Habit[], locale: Locale = 'en'): string {
  if (!log) return '';
  const m = messages(locale).prompt;
  const byId = new Map(habits.map((h) => [h.id, h]));
  const parts = Object.entries(log.doses).map(
    ([id, d]) => `${d.approx ? m.about : ''}${d.count} ${byId.get(id)?.unit ?? id}`,
  );
  const did = log.did.map((id) => {
    const habit = byId.get(id);
    const picked = log.chosen?.[id]?.map(
      (o) => habit?.options?.find((x) => x.id === o)?.label.toLowerCase() ?? o,
    );
    const name = habit?.name.toLowerCase() ?? id;
    return picked?.length ? `${name} (${picked.join(', ')})` : name;
  });
  if (did.length) parts.push(m.did(did.join(', ')));
  if (log.instead) parts.push(m.insteadNote(log.instead));
  return parts.join('; ');
}
