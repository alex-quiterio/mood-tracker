import { addDays, localDate, parseLocalDate } from '@domain/shared/dates';
import { average } from '@domain/shared/math';

import { Entry, Mood } from './types';

/** How far back the calendar shows. */
export const HISTORY_MONTHS = 6;
/** How many days, ending today, can still be filled in or edited. */
export const EDITABLE_DAYS = 7;

export type MonthRef = { year: number; month: number }; // month 0–11

export const monthOf = (date: string): MonthRef => {
  const d = parseLocalDate(date);
  return { year: d.getFullYear(), month: d.getMonth() };
};

export const shiftMonth = ({ year, month }: MonthRef, delta: number): MonthRef => {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
};

const monthIndex = (m: MonthRef) => m.year * 12 + m.month;

/** The earliest day the calendar shows: the same day of the month, six months back (clamped to month end). */
export function earliestDay(today: string): string {
  const t = parseLocalDate(today);
  const target = new Date(t.getFullYear(), t.getMonth() - HISTORY_MONTHS, 1, 12);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(t.getDate(), lastDay));
  return localDate(target);
}

export const isVisible = (date: string, today: string) => date >= earliestDay(today) && date <= today;

export const isEditable = (date: string, today: string) =>
  date <= today && date >= addDays(today, -(EDITABLE_DAYS - 1));

export const canShowMonth = (m: MonthRef, today: string) =>
  monthIndex(m) >= monthIndex(monthOf(earliestDay(today))) && monthIndex(m) <= monthIndex(monthOf(today));

/**
 * The days of a month laid out in Monday-first weeks, with null for the blanks
 * before the 1st and after the last day.
 */
export function monthGrid({ year, month }: MonthRef): (string | null)[][] {
  const first = new Date(year, month, 1, 12);
  const days = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday = 0
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) cells.push(localDate(new Date(year, month, d, 12)));
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

export type DaySummary = { count: number; average: number | null; mood: Mood | null };

/** How a day went: its check-ins, their average, and that average as a mood for colouring. */
export function summarizeDay(entries: Entry[], date: string): DaySummary {
  const moods = entries.filter((e) => e.date === date).map((e) => e.mood);
  const mean = average(moods);
  if (mean === null) return { count: 0, average: null, mood: null };
  return { count: moods.length, average: mean, mood: Math.min(5, Math.max(1, Math.round(mean))) as Mood };
}

export type DayTotals = { unlocks: number | null; steps: number | null };

/**
 * Unlocks and steps added up over a day's check-ins, or null when none of them
 * counted that signal. Each check-in counts since the one before, so the morning's
 * share starts the evening before.
 */
export function dayTotals(entries: Entry[], date: string): DayTotals {
  const day = entries.filter((e) => e.date === date);
  const total = (values: (number | undefined)[]) => {
    const counted = values.filter((v): v is number => v !== undefined);
    return counted.length === 0 ? null : counted.reduce((sum, v) => sum + v, 0);
  };
  return { unlocks: total(day.map((e) => e.unlocks)), steps: total(day.map((e) => e.steps)) };
}
