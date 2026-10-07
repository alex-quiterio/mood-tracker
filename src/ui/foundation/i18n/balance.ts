import { Verdict } from '@domain/habits/balance';
import { Locale } from '@domain/settings/language';

import { messages } from './messages';

export const verdictLabel = (verdict: Verdict, locale: Locale = 'en') =>
  messages(locale).balance.verdicts[verdict.kind];

/**
 * "+10 lighter than last week", phrased so improvement stands out and a dip stays gentle.
 * A `past` week is compared with "the week before" instead.
 */
export function changeText(change: number | null, locale: Locale = 'en', past = false): string | null {
  if (change === null) return null;
  const m = messages(locale).balance;
  if (change > 0) return past ? m.lighterThanBefore(change) : m.lighter(change);
  if (change < 0) return past ? m.heavierThanBefore(change) : m.heavierThanLast(change);
  return past ? m.sameAsBefore : m.same;
}
