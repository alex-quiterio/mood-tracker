import { Verdict } from '@domain/habits/balance';
import { Locale } from '@domain/settings/language';

import { messages } from './messages';

export const verdictLabel = (verdict: Verdict, locale: Locale = 'en') =>
  messages(locale).balance.verdicts[verdict.kind];

/** "+10 lighter than last week", phrased so improvement stands out and a dip stays gentle. */
export function changeText(change: number | null, locale: Locale = 'en'): string | null {
  if (change === null) return null;
  const m = messages(locale).balance;
  if (change > 0) return m.lighter(change);
  if (change < 0) return m.heavierThanLast(change);
  return m.same;
}
