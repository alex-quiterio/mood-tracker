import { Slot } from '@domain/checkins/types';
import { Habit, HabitLog, MAX_DOSES, countsDoses } from '@domain/habits/habits';

import { COMPARED_CURRENCY, MerchantLinks, merchantKey } from './categories';
import { Payment, paymentsIn } from './payments';

/**
 * Doses a check-in's payments suggest, through the merchants the user linked to a
 * habit ("De Republiek" → drinks). They only ever prefill a check-in that hasn't
 * logged that habit, marked as rough, for the user to change before saving: a
 * statement says what was paid, not what was had.
 */

/** Per habit id: the doses suggested and how many payments they come from. */
export type LinkedDoses = Record<string, { count: number; payments: number }>;

/**
 * For each habit counted in doses: euros spent ÷ its price per dose, rounded and at
 * least 1, plus 1 per payment in another currency. Without a price, 1 per payment.
 */
export function linkedDoses(
  payments: Payment[],
  links: MerchantLinks,
  habits: Habit[],
  date: string,
  slot: Slot,
): LinkedDoses {
  const byId = new Map(habits.filter((h) => !h.archived && countsDoses(h)).map((h) => [h.id, h]));
  const spent = new Map<string, { euros: number; eurPayments: number; otherPayments: number }>();
  for (const p of paymentsIn(payments, date, date, slot)) {
    const habitId = links[merchantKey(p.description)];
    if (!habitId || !byId.has(habitId)) continue;
    const s = spent.get(habitId) ?? { euros: 0, eurPayments: 0, otherPayments: 0 };
    if (p.currency === COMPARED_CURRENCY) {
      s.euros += p.amount;
      s.eurPayments++;
    } else s.otherPayments++;
    spent.set(habitId, s);
  }

  const doses: LinkedDoses = {};
  for (const [habitId, s] of spent) {
    const price = byId.get(habitId)!.pricePerDose;
    let fromEuros = s.eurPayments;
    if (price && s.eurPayments > 0) fromEuros = Math.max(1, Math.round(s.euros / price));
    doses[habitId] = {
      count: Math.min(MAX_DOSES, fromEuros + s.otherPayments),
      payments: s.eurPayments + s.otherPayments,
    };
  }
  return doses;
}

/** Fills in the suggested doses, as rough, for habits the log hasn't logged; logged ones stay as they are. */
export function prefillLinkedDoses(log: HabitLog, suggested: LinkedDoses): HabitLog {
  const missing = Object.entries(suggested).filter(([id]) => !log.doses[id]);
  if (missing.length === 0) return log;
  const doses = { ...log.doses };
  for (const [id, s] of missing) doses[id] = { count: s.count, approx: true };
  return { ...log, doses };
}
