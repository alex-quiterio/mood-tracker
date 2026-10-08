import { Habit, countsDoses, isDayWin } from '@domain/habits/habits';
import { savings } from '@domain/habits/insights';
import { Urge } from '@domain/habits/urges';
import { average } from '@domain/shared/math';
import { Payment, mainCurrency, paymentsIn, statementSpan } from '@domain/spending/payments';
import { habitEstimate } from '@domain/spending/realVsEstimate';

import { MonthRef, monthGrid } from './calendar';
import { Entry } from './types';

/** One value per day of the month; null where nothing was logged (or the day is still to come). */
export type DaySeries = (number | null)[];

export type HabitMonth = {
  habit: Habit;
  perDay: DaySeries;
  /** Doses (reduce) or check-ins done (grow), over the month. */
  total: number;
  /** Days it was logged: with none (reduce) or done (grow). */
  winDays: number;
};

export type MonthTotals = {
  /** Every day of the month, 1st to last. */
  days: string[];
  checkIns: { count: number; possible: number; average: number | null; perDay: DaySeries };
  /** Average mood per day, for colouring. */
  moodPerDay: DaySeries;
  steps: { total: number; perDay: DaySeries } | null;
  unlocks: { total: number; perDay: DaySeries } | null;
  sleep: { averageHours: number; nights: number; perDay: DaySeries } | null;
  habits: HabitMonth[];
  urges: { total: number; passed: number; perDay: DaySeries } | null;
  /** Euros kept by having less than usual. */
  saved: number;
  /**
   * Spent by card per the imported statement, in its main currency, with the habits'
   * estimate beside it. Days the statement doesn't cover stay empty; null without one.
   */
  card: { total: number; currency: string; perDay: DaySeries; estimate: number } | null;
};

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Everything logged in a month, added up, with a value per day to draw. Days after `today` stay empty. */
export function monthTotals(
  entries: Entry[],
  urges: Urge[],
  habits: Habit[],
  month: MonthRef,
  today: string,
  payments: Payment[] = [],
): MonthTotals {
  const days = monthGrid(month)
    .flat()
    .filter((d): d is string => d !== null);
  const first = days[0];
  const last = days[days.length - 1];
  const byDay = new Map(days.map((d) => [d, entries.filter((e) => e.date === d)]));
  const past = days.filter((d) => d <= today);

  /** Adds up a value over each day's check-ins; null on days where none had it. */
  const series = (pick: (e: Entry) => number | undefined): DaySeries =>
    days.map((d) => {
      const values = byDay
        .get(d)!
        .map(pick)
        .filter((v): v is number => v !== undefined);
      return values.length ? sum(values) : null;
    });
  const totalOf = (s: DaySeries) => sum(s.filter((v): v is number => v !== null));
  const signal = (perDay: DaySeries) =>
    perDay.some((v) => v !== null) ? { total: totalOf(perDay), perDay } : null;

  const monthEntries = days.flatMap((d) => byDay.get(d)!);
  const sleepPerDay = series((e) => e.sleep?.hours);
  const nights = sleepPerDay.filter((v): v is number => v !== null);

  // Archived habits too: a past month may have logged them.
  const habitMonths = habits.flatMap((habit): HabitMonth[] => {
    const perDay = countsDoses(habit)
      ? series((e) => e.habits?.doses[habit.id]?.count)
      : series((e) => (e.habits ? (e.habits.did.includes(habit.id) ? 1 : 0) : undefined));
    const logged = perDay.filter((v): v is number => v !== null);
    if (logged.length === 0) return [];
    const winDays = logged.filter((v) => isDayWin(habit, v)).length;
    return [{ habit, perDay, total: sum(logged), winDays }];
  });

  const monthUrges = urges.filter((u) => u.date >= first && u.date <= last);
  const urgesPerDay = days.map((d) => {
    const n = monthUrges.filter((u) => u.date === d).length;
    return d <= today ? n : null;
  });

  const span = statementSpan(payments);
  const monthPayments = paymentsIn(payments, first, last);
  const currency = mainCurrency(monthPayments.length ? monthPayments : payments);
  const cardPerDay: DaySeries = days.map((d) => {
    if (!span || d < span.from || d > span.to || d > today) return null;
    const spent = monthPayments.filter((p) => p.date === d && p.currency === currency);
    return Math.round(sum(spent.map((p) => p.amount)) * 100) / 100;
  });
  const cardDays = cardPerDay.filter((v): v is number => v !== null);

  return {
    days,
    checkIns: {
      count: monthEntries.length,
      possible: past.length * 3,
      average: average(monthEntries.map((e) => e.mood)),
      perDay: days.map((d) => (d <= today ? byDay.get(d)!.length : null)),
    },
    moodPerDay: days.map((d) => average(byDay.get(d)!.map((e) => e.mood))),
    steps: signal(series((e) => e.steps)),
    unlocks: signal(series((e) => e.unlocks)),
    sleep: nights.length
      ? { averageHours: sum(nights) / nights.length, nights: nights.length, perDay: sleepPerDay }
      : null,
    habits: habitMonths,
    urges: monthUrges.length
      ? {
          total: monthUrges.length,
          passed: monthUrges.filter((u) => u.outcome === 'passed').length,
          perDay: urgesPerDay,
        }
      : null,
    saved: habits.reduce(
      (total, h) => total + (h.kind === 'reduce' ? savings(entries, h, first, last) : 0),
      0,
    ),
    card: cardDays.length
      ? {
          total: Math.round(sum(cardDays) * 100) / 100,
          currency,
          perDay: cardPerDay,
          estimate: habitEstimate(monthEntries, habits),
        }
      : null,
  };
}
