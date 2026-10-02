import { Entry } from '@domain/checkins/types';
import { Locale } from '@domain/settings/language';

import { formatMoment } from './format';
import { messages } from './messages';

/**
 * When a check-in was logged, and when it was last edited if it was:
 * "Logged Thursday, 2 October at 09:12 · edited at 14:30". The edit's date
 * shows only when it isn't the day it was logged.
 */
export function describeLoggedAt(entry: Entry, timeZone: string | null, locale: Locale = 'en'): string {
  const m = messages(locale).checkin;
  const logged = formatMoment(new Date(entry.recordedAt), timeZone, locale);
  const line = m.loggedAt(logged.date, logged.time);
  if (!entry.updatedAt) return line;
  const edited = formatMoment(new Date(entry.updatedAt), timeZone, locale);
  return `${line} · ${m.editedAt(edited.time, edited.date === logged.date ? undefined : edited.date)}`;
}
