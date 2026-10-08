import { describe, expect, it } from '@jest/globals';

import { Entry } from '@domain/checkins/types';
import { Payment } from '@domain/spending/payments';
import { spendingOverTime } from '@domain/spending/periods';

const entry = (date: string): Entry => ({ date, slot: 'morning', mood: 3, recordedAt: `${date}T09:00:00Z` });
const pay = (date: string, amount: number, currency = 'EUR'): Payment => ({
  at: `${date}T10:00:00`,
  date,
  amount,
  currency,
  description: 'Shop',
  kind: 'card',
});

describe('spendingOverTime', () => {
  const entries = [entry('2026-09-17'), entry('2026-09-03')];
  const payments = [
    pay('2026-09-20', 10),
    pay('2026-09-22', 5.5),
    pay('2026-10-06', 3, 'GBP'),
    pay('2026-10-07', 2),
  ];

  it('totals each week from the first check-in, Monday to Sunday', () => {
    const { currency, periods } = spendingOverTime(entries, payments, 'week', '2026-10-08');
    expect(currency).toBe('EUR');
    expect(periods.map((p) => p.from)).toEqual([
      '2026-08-31',
      '2026-09-07',
      '2026-09-14',
      '2026-09-21',
      '2026-09-28',
      '2026-10-05',
    ]);
    expect(periods[0].to).toBe('2026-09-06');
    // Before the statement starts there is no total, not a zero.
    expect(periods[0].spent).toBeNull();
    expect(periods[2].spent).toEqual({ EUR: 10 });
    expect(periods[3].spent).toEqual({ EUR: 5.5 });
    expect(periods[4].spent).toEqual({});
    expect(periods[5].spent).toEqual({ GBP: 3, EUR: 2 });
  });

  it('totals each month from the 1st, across a year end', () => {
    const { periods } = spendingOverTime(
      [entry('2025-12-15')],
      [pay('2025-12-31', 4), pay('2026-01-01', 6)],
      'month',
      '2026-02-10',
    );
    expect(periods.map((p) => [p.from, p.to])).toEqual([
      ['2025-12-01', '2025-12-31'],
      ['2026-01-01', '2026-01-31'],
      ['2026-02-01', '2026-02-28'],
    ]);
    expect(periods.map((p) => p.spent)).toEqual([{ EUR: 4 }, { EUR: 6 }, null]);
  });

  it('has no periods without a check-in', () => {
    expect(spendingOverTime([], payments, 'week', '2026-10-08').periods).toEqual([]);
  });
});
