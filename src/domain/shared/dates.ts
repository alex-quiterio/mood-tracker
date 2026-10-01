import { Slot } from '../checkins/types';

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

/** Before 12:00 is morning, before 18:00 is afternoon, otherwise evening. */
export function slotForTime(d: Date = new Date()): Slot {
  const h = d.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function weekdayShort(date: string): string {
  return WEEKDAYS[parseLocalDate(date).getDay()];
}

export function dayOfMonth(date: string): number {
  return parseLocalDate(date).getDate();
}

export function isValidDate(date: unknown): date is string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return localDate(parseLocalDate(date)) === date;
}
