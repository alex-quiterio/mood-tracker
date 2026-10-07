import { Slot } from '@domain/checkins/types';
import { isValidDate, slotForTime } from '@domain/shared/dates';

/**
 * Money that really left the account, from an imported bank statement: card
 * payments, cash withdrawals and fees. Payments are only ever read from a file,
 * never typed in, and they sit next to the check-ins of the same time of day.
 */

export type PaymentKind = 'card' | 'cash' | 'fee';

export type Payment = {
  /** When it started, as local wall-clock time, YYYY-MM-DDTHH:MM:SS. */
  at: string;
  /** Local calendar date, YYYY-MM-DD (the start of `at`). */
  date: string;
  /** What left the account, fees included; always positive. */
  amount: number;
  /** ISO 4217, e.g. EUR. */
  currency: string;
  description: string;
  kind: PaymentKind;
};

/** Amounts per currency, e.g. { EUR: 42.5 }. */
export type Money = Record<string, number>;

const AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const KINDS: PaymentKind[] = ['card', 'cash', 'fee'];

/** With the time, amount and description, a payment is the same one when imported again. */
export const paymentKey = (p: Payment) => `${p.at}|${p.amount}|${p.currency}|${p.description}`;

/** Adds payments that aren't known yet; a payment imported again (say, once pending, now done) replaces itself. */
export function mergePayments(existing: Payment[], incoming: Payment[]): Payment[] {
  const byKey = new Map<string, Payment>();
  for (const p of [...existing, ...incoming]) byKey.set(paymentKey(p), p);
  return [...byKey.values()].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

export function parsePayment(value: unknown): Payment | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.at !== 'string' || !AT.test(v.at)) return null;
  if (!isValidDate(v.date) || v.date !== v.at.slice(0, 10)) return null;
  if (typeof v.amount !== 'number' || !Number.isFinite(v.amount) || v.amount <= 0) return null;
  if (typeof v.currency !== 'string' || !/^[A-Z]{3}$/.test(v.currency)) return null;
  if (typeof v.description !== 'string') return null;
  if (!KINDS.includes(v.kind as PaymentKind)) return null;
  return {
    at: v.at,
    date: v.date,
    amount: v.amount,
    currency: v.currency,
    description: v.description,
    kind: v.kind as PaymentKind,
  };
}

/** Stored payments; anything that isn't valid is dropped. */
export const parsePayments = (value: unknown): Payment[] =>
  Array.isArray(value) ? value.map(parsePayment).filter((p): p is Payment => p !== null) : [];

/** The local time a payment's wall-clock time stands for. */
function wallClock(at: string): Date {
  const [y, mo, d] = at.slice(0, 10).split('-').map(Number);
  const [h, mi, s] = at.slice(11).split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi, s);
}

/** The check-in a payment belongs with: the part of the day it was made in. */
export const slotOfPayment = (p: Payment): Slot => slotForTime(wallClock(p.at));

/** The first and last day a set of statements covers, or null without any. */
export function statementSpan(payments: Payment[]): { from: string; to: string } | null {
  if (payments.length === 0) return null;
  return { from: payments[0].date, to: payments[payments.length - 1].date };
}

/** Payments between two dates (inclusive), optionally only those in one part of the day. */
export const paymentsIn = (payments: Payment[], from: string, to: string, slot?: Slot) =>
  payments.filter((p) => p.date >= from && p.date <= to && (!slot || slotOfPayment(p) === slot));

/** Adds up payments per currency, to the cent. */
export function moneyOf(payments: Payment[]): Money {
  const money: Money = {};
  for (const p of payments) money[p.currency] = Math.round(((money[p.currency] ?? 0) + p.amount) * 100) / 100;
  return money;
}

/** The currency most payments were made in, for one headline number; EUR when there are none. */
export function mainCurrency(payments: Payment[]): string {
  const counts = new Map<string, number>();
  for (const p of payments) counts.set(p.currency, (counts.get(p.currency) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'EUR';
}
