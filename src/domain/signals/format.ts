import { Entry } from '../checkins/types';
import { localDate, weekdayShort } from '../shared/dates';

/** "21:00" when `from` is on `day`, otherwise "Tue 21:00". */
export function formatSince(from: Date, day: string): string {
  const time = `${String(from.getHours()).padStart(2, '0')}:${String(from.getMinutes()).padStart(2, '0')}`;
  const fromDate = localDate(from);
  return fromDate === day ? time : `${weekdayShort(fromDate)} ${time}`;
}

export function formatUnlocksSince(entry: Pick<Entry, 'date' | 'unlocksFrom'>): string {
  return entry.unlocksFrom ? formatSince(new Date(entry.unlocksFrom), entry.date) : '';
}

/** 12,480 */
export const formatSteps = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** 980 · 12.5k, for tight spaces. */
export const formatStepsShort = (n: number) =>
  n < 1000 ? String(Math.round(n)) : `${(n / 1000).toFixed(1)}k`;
