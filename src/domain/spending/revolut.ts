import { parseCsv } from '@domain/shared/csv';

import { Payment, PaymentKind, mergePayments } from './payments';

/**
 * Reads a Revolut account statement exported as CSV ("Excel" in the app), with the
 * columns Type, Product, Started Date, Completed Date, Description, Amount, Fee,
 * Currency, State and Balance, found by name so their order doesn't matter.
 *
 * Only money spent counts: card payments, cash withdrawals and fees, completed or
 * still pending. Transfers, top-ups, exchanges, refunds and anything reverted or
 * declined are skipped, so moving money between your own pockets never looks like
 * spending.
 */

export type StatementErrorCode = 'notRevolut' | 'empty';

export class StatementError extends Error {
  constructor(readonly code: StatementErrorCode) {
    super(code);
  }
}

export type StatementImport = {
  payments: Payment[];
  /** Rows that weren't spending (transfers, top-ups…) or couldn't be read. */
  skipped: number;
};

const KIND_OF_TYPE: Record<string, PaymentKind> = { CARD_PAYMENT: 'card', ATM: 'cash', FEE: 'fee' };
const SPENT_STATES = new Set(['COMPLETED', 'PENDING']);
const REQUIRED = ['Type', 'Started Date', 'Description', 'Amount', 'Currency', 'State'];

/** "2026-10-05 13:45:12" (or with a T) as wall-clock YYYY-MM-DDTHH:MM:SS, or null. */
function wallClockOf(value: string): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value.trim());
  return m ? `${m[1]}T${m[2]}:${m[3]}:${m[4] ?? '00'}` : null;
}

const numberOf = (value: string | undefined) => {
  const n = Number((value ?? '').trim());
  return Number.isFinite(n) ? n : NaN;
};

export function parseRevolutCsv(text: string): StatementImport {
  const [header, ...rows] = parseCsv(text);
  const column = new Map((header ?? []).map((name, i) => [name.trim(), i]));
  if (!REQUIRED.every((name) => column.has(name))) throw new StatementError('notRevolut');
  const cell = (row: string[], name: string) => row[column.get(name) ?? -1] ?? '';

  const payments: Payment[] = [];
  let skipped = 0;
  for (const row of rows) {
    const kind = KIND_OF_TYPE[cell(row, 'Type').trim()];
    const at = wallClockOf(cell(row, 'Started Date'));
    const amount = numberOf(cell(row, 'Amount'));
    const fee = column.has('Fee') ? numberOf(cell(row, 'Fee')) : 0;
    const currency = cell(row, 'Currency').trim().toUpperCase();
    if (
      !kind ||
      !at ||
      !SPENT_STATES.has(cell(row, 'State').trim().toUpperCase()) ||
      !(amount < 0) ||
      !/^[A-Z]{3}$/.test(currency)
    ) {
      skipped++;
      continue;
    }
    payments.push({
      at,
      date: at.slice(0, 10),
      amount: Math.round((-amount + (Number.isFinite(fee) ? Math.abs(fee) : 0)) * 100) / 100,
      currency,
      description: cell(row, 'Description').trim(),
      kind,
    });
  }
  if (payments.length === 0) throw new StatementError('empty');
  return { payments: mergePayments([], payments), skipped };
}
