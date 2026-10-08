import { Entry, Slot } from '@domain/checkins/types';
import { Habit } from '@domain/habits/habits';

import { Payment, paymentsIn, statementSpan } from './payments';

/**
 * Real spending by category, next to the estimate. A statement says where money
 * went (a merchant), not why, so the categories are the user's habits (any of them,
 * to reduce or to grow) and a merchant counts toward at most one, once the user
 * links it ("De Republiek" → drinks, "Wood & Co" → making things).
 * Links are kept per merchant, so every later statement sorts itself.
 */

/** Merchant (normalised description) → habit id. */
export type MerchantLinks = Record<string, string>;

/** The currency estimates are in, and so the only one compared. */
export const COMPARED_CURRENCY = 'EUR';

/** A merchant as a key: case and spacing don't matter. */
export const merchantKey = (description: string) => description.trim().toLowerCase().replace(/\s+/g, ' ');

export function parseMerchantLinks(value: unknown): MerchantLinks {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const links: MerchantLinks = {};
  for (const [merchant, habitId] of Object.entries(value)) {
    if (merchant.trim() && typeof habitId === 'string' && habitId) links[merchantKey(merchant)] = habitId;
  }
  return links;
}

/** Links a merchant to a habit, or unlinks it with null. */
export function linkMerchant(
  links: MerchantLinks,
  description: string,
  habitId: string | null,
): MerchantLinks {
  const key = merchantKey(description);
  const rest = Object.fromEntries(Object.entries(links).filter(([merchant]) => merchant !== key));
  return habitId ? { ...rest, [key]: habitId } : rest;
}

export type CategoryComparison = {
  habit: Habit;
  /** Euros: doses × price in the check-ins of the period; null for habits without a price, which can't be estimated. */
  estimate: number | null;
  /** Euros really spent at merchants linked to this habit. */
  spent: number;
};

export type MerchantTotal = {
  key: string;
  /** As the statement first wrote it. */
  name: string;
  total: number;
  count: number;
  habitId: string | null;
};

export type SpendingByCategory = {
  categories: CategoryComparison[];
  /** Euros spent at merchants not linked to any habit. */
  unlinked: number;
  /** Where the money went, biggest first. */
  merchants: MerchantTotal[];
};

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * Estimated against spent per priced habit between two dates (inclusive), in euros.
 * Null when the imported statements don't cover any of those days.
 */
export function spendingByCategory(
  entries: Entry[],
  habits: Habit[],
  payments: Payment[],
  links: MerchantLinks,
  from: string,
  to: string,
): SpendingByCategory | null {
  const span = statementSpan(payments);
  if (!span || from > span.to || to < span.from) return null;

  const merchants = new Map<string, MerchantTotal>();
  for (const p of paymentsIn(payments, from, to)) {
    if (p.currency !== COMPARED_CURRENCY) continue;
    const key = merchantKey(p.description);
    const m = merchants.get(key) ?? {
      key,
      name: p.description,
      total: 0,
      count: 0,
      habitId: links[key] ?? null,
    };
    m.total = cents(m.total + p.amount);
    m.count++;
    merchants.set(key, m);
  }

  const checkIns = entries.filter((e) => e.date >= from && e.date <= to);
  const known = new Set(habits.map((h) => h.id));
  const categories = habits
    .map((habit) => ({
      habit,
      estimate:
        habit.kind === 'reduce' && habit.pricePerDose
          ? cents(
              checkIns.reduce(
                (sum, e) => sum + (e.habits?.doses[habit.id]?.count ?? 0) * (habit.pricePerDose ?? 0),
                0,
              ),
            )
          : null,
      spent: cents(
        [...merchants.values()].filter((m) => m.habitId === habit.id).reduce((sum, m) => sum + m.total, 0),
      ),
    }))
    .filter((c) => (c.estimate ?? 0) > 0 || c.spent > 0)
    .sort((a, b) => Math.max(b.estimate ?? 0, b.spent) - Math.max(a.estimate ?? 0, a.spent));

  return {
    categories,
    unlinked: cents(
      [...merchants.values()]
        .filter((m) => !m.habitId || !known.has(m.habitId))
        .reduce((sum, m) => sum + m.total, 0),
    ),
    merchants: [...merchants.values()].sort((a, b) => b.total - a.total),
  };
}

export type HabitSpend = { habit: Habit; spent: number };

/**
 * Euros spent at merchants linked to each habit between two dates (inclusive),
 * optionally in one part of the day, biggest first. Only habits with spending.
 */
export function spentByHabit(
  payments: Payment[],
  links: MerchantLinks,
  habits: Habit[],
  from: string,
  to: string,
  slot?: Slot,
): HabitSpend[] {
  const spent = new Map<string, number>();
  for (const p of paymentsIn(payments, from, to, slot)) {
    const habitId = links[merchantKey(p.description)];
    if (p.currency !== COMPARED_CURRENCY || !habitId) continue;
    spent.set(habitId, cents((spent.get(habitId) ?? 0) + p.amount));
  }
  return habits
    .filter((habit) => spent.has(habit.id))
    .map((habit) => ({ habit, spent: spent.get(habit.id)! }))
    .sort((a, b) => b.spent - a.spent);
}
