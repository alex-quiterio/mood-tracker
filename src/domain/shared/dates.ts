import { Slot } from '@domain/checkins/types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD. Never UTC, so late-evening entries stay on the right day. */
export function localDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses YYYY-MM-DD as local noon, which keeps day arithmetic clear of DST edges. */
export function parseLocalDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(date: string, days: number): string {
  const d = parseLocalDate(date);
  d.setDate(d.getDate() + days);
  return localDate(d);
}

/** The `count` days ending at `end` (inclusive), oldest first. */
export function lastNDays(count: number, end: string = localDate()): string[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - (count - 1)));
}

/** Every day from `from` to `to` (both included), oldest first; empty when `to` is before `from`. */
export function daysFrom(from: string, to: string): string[] {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}

/** The Monday of the week `date` falls in; weeks start on Monday. */
export function weekStart(date: string): string {
  return addDays(date, -((parseLocalDate(date).getDay() + 6) % 7));
}

/** The Monday-to-Sunday week `date` falls in. */
export const weekOf = (date: string): string[] =>
  Array.from({ length: 7 }, (_, i) => addDays(weekStart(date), i));

/** This week from Monday up to and including `today`. */
export const weekSoFar = (today: string): string[] => weekOf(today).filter((d) => d <= today);

/** Before 12:00 is morning, before 18:00 is afternoon, otherwise evening. */
export function slotForTime(d: Date = new Date()): Slot {
  const h = d.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

/** Small hours before this still belong to the night of the previous day. */
export const NIGHT_ENDS_HOUR = 4;

/**
 * The day and slot a check-in made at `d` belongs to. Between midnight and
 * `NIGHT_ENDS_HOUR` it is the previous day's evening (the night), so a 2 am
 * check-in closes yesterday instead of opening today.
 */
export function checkInMoment(d: Date = new Date()): { date: string; slot: Slot } {
  if (d.getHours() < NIGHT_ENDS_HOUR) {
    const before = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, 12);
    return { date: localDate(before), slot: 'evening' };
  }
  return { date: localDate(d), slot: slotForTime(d) };
}

export function dayOfMonth(date: string): number {
  return parseLocalDate(date).getDate();
}

export function isValidDate(date: unknown): date is string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return localDate(parseLocalDate(date)) === date;
}
