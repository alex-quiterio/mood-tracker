import { Entry } from '@domain/checkins/types';
import { formatDecimal, formatInteger, weekdayShort } from './format';
import { Locale } from '@domain/settings/language';
import { localDate } from '@domain/shared/dates';

/** "21:00" when `from` is on `day`, otherwise "Tue 21:00". */
export function formatSince(from: Date, day: string, locale: Locale = 'en'): string {
  const time = `${String(from.getHours()).padStart(2, '0')}:${String(from.getMinutes()).padStart(2, '0')}`;
  const fromDate = localDate(from);
  return fromDate === day ? time : `${weekdayShort(fromDate, locale)} ${time}`;
}

export function formatUnlocksSince(
  entry: Pick<Entry, 'date' | 'unlocksFrom'>,
  locale: Locale = 'en',
): string {
  return entry.unlocksFrom ? formatSince(new Date(entry.unlocksFrom), entry.date, locale) : '';
}

/** 12,480 · 12 480 */
export const formatSteps = (n: number, locale: Locale = 'en') => formatInteger(n, locale);

/** 980 · 12.5k (12,5k) · 245k · 1.24M, for tight spaces: never more than four digits. */
export function formatStepsShort(n: number, locale: Locale = 'en'): string {
  if (Math.round(n) < 1000) return String(Math.round(n));
  if (Math.round(n / 1000) < 1000) return `${formatDecimal(n / 1000, n < 99_950 ? 1 : 0, locale)}k`;
  return `${formatDecimal(n / 1_000_000, n < 9_995_000 ? 2 : 1, locale)}M`;
}
