import { Entry } from '@domain/checkins/types';
import { addDays, localDate, parseLocalDate, weekStart } from '@domain/shared/dates';

import { Money, Payment, mainCurrency, moneyOf, paymentsIn, statementSpan } from './payments';

/** What spending can be totalled over. */
export const SPENDING_PERIODS = ['week', 'month'] as const;
export type SpendingPeriod = (typeof SPENDING_PERIODS)[number];

export type PeriodSpending = {
  /** First and last day of the period, YYYY-MM-DD; weeks start on Monday, months on the 1st. */
  from: string;
  to: string;
  /** Spent per currency, or null when the imported statements don't cover the period. */
  spent: Money | null;
};

export type SpendingOverTime = {
  /** The headline currency, the one the bars are drawn in. */
  currency: string;
  /** Oldest first, from the period of the first check-in up to the one holding `today`. */
  periods: PeriodSpending[];
};

const startOf = (date: string, per: SpendingPeriod) =>
  per === 'week' ? weekStart(date) : `${date.slice(0, 8)}01`;

/** The first day of the period after the one starting on `start`. */
function nextStart(start: string, per: SpendingPeriod): string {
  if (per === 'week') return addDays(start, 7);
  const d = parseLocalDate(start);
  d.setMonth(d.getMonth() + 1);
  return localDate(d);
}

/**
 * What really left the account in each week or month since the first check-in.
 * Periods the statements don't reach have no total rather than zero.
 */
export function spendingOverTime(
  entries: Entry[],
  payments: Payment[],
  per: SpendingPeriod,
  today: string,
): SpendingOverTime {
  const currency = mainCurrency(payments);
  const first = entries.reduce<string | null>(
    (min, e) => (min === null || e.date < min ? e.date : min),
    null,
  );
  const span = statementSpan(payments);
  if (first === null || first > today) return { currency, periods: [] };
  const periods: PeriodSpending[] = [];
  for (let from = startOf(first, per); from <= today; from = nextStart(from, per)) {
    const to = addDays(nextStart(from, per), -1);
    const covered = span !== null && from <= span.to && to >= span.from;
    periods.push({ from, to, spent: covered ? moneyOf(paymentsIn(payments, from, to)) : null });
  }
  return { currency, periods };
}
