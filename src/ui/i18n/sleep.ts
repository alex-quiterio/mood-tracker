import { Sleep } from '@domain/checkins/sleep';
import { Locale } from '@domain/settings/language';

import { formatHours } from './format';
import { messages } from './messages';

/** "🌙 7.5 h · Well", or just the part that was logged. */
export function describeSleep(sleep: Sleep | undefined, locale: Locale = 'en'): string {
  if (!sleep) return '';
  const m = messages(locale).sleep;
  const parts = [
    ...(sleep.hours !== undefined ? [m.hours(formatHours(sleep.hours, locale))] : []),
    ...(sleep.quality ? [m.quality[sleep.quality]] : []),
  ];
  return parts.length ? `🌙 ${parts.join(' · ')}` : '';
}

/** Sleep for the Claude prompt: "7.5h, sleep 4/5". */
export function promptSleepText(sleep: Sleep, locale: Locale = 'en'): string {
  const p = messages(locale).prompt;
  return [
    ...(sleep.hours !== undefined ? [p.sleepHours(formatHours(sleep.hours, locale))] : []),
    ...(sleep.quality ? [p.sleepQuality(sleep.quality)] : []),
  ].join(', ');
}
