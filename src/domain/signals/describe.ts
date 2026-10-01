import { Entry } from '@domain/checkins/types';
import { Locale } from '@domain/i18n/locale';
import { messages } from '@domain/i18n/messages';

import { formatSince, formatSteps } from './format';

/**
 * The phone signals saved with a check-in, as display lines. Shares one line when
 * both cover the same window ("📱 23 unlocks · 👟 1,240 steps since 09:12"),
 * otherwise one line each.
 */
export function describeSignals(entry: Entry, locale: Locale = 'en'): string[] {
  const m = messages(locale).signals;
  const parts: { text: string; since: string }[] = [];
  if (entry.unlocks !== undefined && entry.unlocksFrom) {
    parts.push({
      text: `📱 ${entry.unlocks} ${m.unlocks(entry.unlocks)}`,
      since: formatSince(new Date(entry.unlocksFrom), entry.date, locale),
    });
  }
  if (entry.steps !== undefined && entry.stepsFrom) {
    parts.push({
      text: `👟 ${formatSteps(entry.steps, locale)} ${m.steps(entry.steps)}`,
      since: formatSince(new Date(entry.stepsFrom), entry.date, locale),
    });
  }
  if (parts.length === 2 && parts[0].since === parts[1].since) {
    return [m.since(`${parts[0].text} · ${parts[1].text}`, parts[0].since)];
  }
  return parts.map((p) => m.since(p.text, p.since));
}
