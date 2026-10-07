import { Entry, Slot } from '@domain/checkins/types';
import { Habit } from '@domain/habits/habits';

import { Money, Payment, mainCurrency, moneyOf, paymentsIn, statementSpan } from './payments';

/**
 * What really left the account next to what the habits estimate (doses × price per
 * dose, in euros). Neither is a judgement: the estimate only covers priced habits,
 * the statement covers everything bought by card.
 */
export type RealVsEstimate = {
  /** Spent per currency, or null when the imported statements don't cover these days. */
  real: Money | null;
  /** The headline currency for `real`. */
  currency: string;
  payments: number;
  /** Euros, from the habit doses logged in the same check-ins. */
  estimate: number;
};

/** The habits' estimate for some check-ins: doses × price, for priced habits to reduce. */
export function habitEstimate(entries: Entry[], habits: Habit[]): number {
  const price = new Map(
    habits.filter((h) => h.kind === 'reduce' && h.pricePerDose).map((h) => [h.id, h.pricePerDose!]),
  );
  let total = 0;
  for (const e of entries) {
    for (const [id, dose] of Object.entries(e.habits?.doses ?? {}))
      total += dose.count * (price.get(id) ?? 0);
  }
  return Math.round(total * 100) / 100;
}

/** Real against estimated between two dates (inclusive), optionally for one part of the day. */
export function realVsEstimate(
  entries: Entry[],
  habits: Habit[],
  payments: Payment[],
  from: string,
  to: string,
  slot?: Slot,
): RealVsEstimate {
  const span = statementSpan(payments);
  const covered = span !== null && from <= span.to && to >= span.from;
  const spent = paymentsIn(payments, from, to, slot);
  const checkIns = entries.filter((e) => e.date >= from && e.date <= to && (!slot || e.slot === slot));
  return {
    real: covered ? moneyOf(spent) : null,
    currency: mainCurrency(spent.length ? spent : payments),
    payments: spent.length,
    estimate: habitEstimate(checkIns, habits),
  };
}
