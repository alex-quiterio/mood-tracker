import { Entry } from '@domain/checkins/types';
import { formatDecimal, formatInteger, weekdayShort } from '@ui/i18n/format';
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

/** 980 · 12.5k (12,5k), for tight spaces. */
export const formatStepsShort = (n: number, locale: Locale = 'en') =>
  n < 1000 ? String(Math.round(n)) : `${formatDecimal(n / 1000, 1, locale)}k`;
