import { describe, expect, it } from '@jest/globals';

import { parseExport, serializeExport } from '@domain/checkins/exportFormat';
import { monthTotals } from '@domain/checkins/monthTotals';
import { Entry } from '@domain/checkins/types';
import { PRESET_HABITS } from '@domain/habits/habits';
import { parseCsv } from '@domain/shared/csv';
import {
  mergePayments,
  moneyOf,
  parsePayments,
  slotOfPayment,
  statementSpan,
} from '@domain/spending/payments';
import { StatementError, parseRevolutCsv } from '@domain/spending/revolut';
import { habitEstimate, realVsEstimate } from '@domain/spending/realVsEstimate';
import { linkMerchant, parseMerchantLinks, spendingByCategory } from '@domain/spending/categories';
import { parseSettings, settingsForBackup } from '@domain/settings/settings';
import { formatMoneys } from '@ui/foundation/i18n/format';

const HEADER = 'Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance';
const statement = [
  HEADER,
  'CARD_PAYMENT,Current,2026-10-05 08:15:02,2026-10-06 09:00:00,Padaria Central,-3.20,0.00,EUR,COMPLETED,96.80',
  'CARD_PAYMENT,Current,2026-10-05 21:40:11,2026-10-06 09:00:00,"Bar ""O Tasco"", Lisboa",-12.50,0.00,EUR,COMPLETED,84.30',
  'ATM,Current,2026-10-05 14:02:00,2026-10-05 14:02:00,Cash at Millennium,-40.00,1.50,EUR,COMPLETED,42.80',
  'TOPUP,Current,2026-10-04 10:00:00,2026-10-04 10:00:00,Top-up by *1234,100.00,0.00,EUR,COMPLETED,100.00',
  'TRANSFER,Current,2026-10-05 12:00:00,2026-10-05 12:00:00,To Rent Pocket,-500.00,0.00,EUR,COMPLETED,0.00',
  'EXCHANGE,Current,2026-10-05 12:30:00,2026-10-05 12:30:00,Exchanged to GBP,-20.00,0.00,EUR,COMPLETED,0.00',
  'CARD_PAYMENT,Current,2026-10-06 13:00:00,,Cafe,-2.10,0.00,EUR,PENDING,40.70',
  'CARD_PAYMENT,Current,2026-10-06 13:30:00,,Declined shop,-9.99,0.00,EUR,DECLINED,40.70',
  'CARD_REFUND,Current,2026-10-06 15:00:00,2026-10-06 15:00:00,Refund,5.00,0.00,EUR,COMPLETED,45.70',
  'CARD_PAYMENT,Current,2026-10-07 19:00:00,2026-10-07 19:00:00,Pret London,-6.40,0.00,GBP,COMPLETED,13.60',
].join('\r\n');

const entry = (date: string, slot: Entry['slot'], drinks: number): Entry => ({
  date,
  slot,
  mood: 3,
  recordedAt: `${date}T10:00:00.000Z`,
  habits: { doses: { drinks: { count: drinks } }, did: [] },
});

describe('csv', () => {
  it('reads quoted cells with commas, quotes and line breaks', () => {
    expect(parseCsv('﻿a,"b, c","say ""hi""","two\nlines"\r\n\r\n1,2,3,4')).toEqual([
      ['a', 'b, c', 'say "hi"', 'two\nlines'],
      ['1', '2', '3', '4'],
    ]);
  });
});

describe('Revolut statements', () => {
  const { payments, skipped } = parseRevolutCsv(statement);

  it('keeps card payments, withdrawals and fees that went through or are pending', () => {
    expect(payments.map((p) => [p.description, p.amount, p.kind])).toEqual([
      ['Padaria Central', 3.2, 'card'],
      ['Cash at Millennium', 41.5, 'cash'],
      ['Bar "O Tasco", Lisboa', 12.5, 'card'],
      ['Cafe', 2.1, 'card'],
      ['Pret London', 6.4, 'card'],
    ]);
    // Top-up, transfer, exchange, declined, refund.
    expect(skipped).toBe(5);
  });

  it('places each payment at its local time, with the check-in of that part of the day', () => {
    expect(payments[0]).toMatchObject({ at: '2026-10-05T08:15:02', date: '2026-10-05', currency: 'EUR' });
    expect(payments.map(slotOfPayment)).toEqual(['morning', 'afternoon', 'evening', 'afternoon', 'evening']);
  });

  it('reads the newer export, where types are written "Card Payment"', () => {
    // The shape of a real 2026 export (LF line ends, title-case types), with made-up rows.
    const newer = [
      HEADER,
      'Card Payment,Current,2026-09-30 09:09:25,2026-10-01 10:29:36,Corner Cafe,-4.75,0.00,EUR,COMPLETED,65.32',
      'Transfer,Current,2026-10-01 19:24:41,2026-10-01 19:24:41,From Instant Access Savings,25.00,0.00,EUR,COMPLETED,90.32',
      'Topup,Current,2026-10-02 08:00:00,2026-10-02 08:00:00,Top-up by *0000,50.00,0.00,EUR,COMPLETED,140.32',
      'Card Payment,Current,2026-10-02 19:31:52,,Supermarket,-31.99,0.00,EUR,PENDING,108.33',
      'Atm,Current,2026-10-03 12:00:00,2026-10-03 12:00:00,Cash,-20.00,0.00,EUR,COMPLETED,88.33',
    ].join('\n');
    const read = parseRevolutCsv(newer);
    expect(read.payments.map((p) => [p.description, p.amount, p.kind])).toEqual([
      ['Corner Cafe', 4.75, 'card'],
      ['Supermarket', 31.99, 'card'],
      ['Cash', 20, 'cash'],
    ]);
    expect(read.skipped).toBe(2);
  });

  it('finds the columns by name, in any order', () => {
    const shuffled = [
      'State,Currency,Amount,Description,Started Date,Type',
      'COMPLETED,EUR,-4.00,Shop,2026-10-01 09:00:00,CARD_PAYMENT',
    ].join('\n');
    expect(parseRevolutCsv(shuffled).payments[0]).toMatchObject({ amount: 4, description: 'Shop' });
  });

  it('refuses files that are not a Revolut statement, or have nothing spent', () => {
    expect(() => parseRevolutCsv('Date,Amount\n2026-10-01,-3')).toThrow(new StatementError('notRevolut'));
    expect(() =>
      parseRevolutCsv(`${HEADER}\nTOPUP,Current,2026-10-04 10:00:00,,Top-up,100,0,EUR,COMPLETED,100`),
    ).toThrow(new StatementError('empty'));
  });

  it('does not count a payment twice when the same statement is imported again', () => {
    expect(mergePayments(payments, parseRevolutCsv(statement).payments)).toHaveLength(payments.length);
  });

  it('keeps payments through a backup, and drops broken ones', () => {
    const file = serializeExport({ entries: [], habits: [], payments });
    expect(parseExport(file).payments).toEqual(payments);
    expect(parsePayments([...payments, { at: 'yesterday', amount: -1 }])).toEqual(payments);
  });
});

describe('real spending against the habits’ estimate', () => {
  const { payments } = parseRevolutCsv(statement);
  const entries = [
    entry('2026-10-05', 'evening', 3),
    entry('2026-10-05', 'morning', 0),
    entry('2026-09-01', 'evening', 2),
  ];

  it('estimates what the habits cost: doses × price', () => {
    expect(habitEstimate(entries, PRESET_HABITS)).toBe(15);
  });

  it('compares a check-in with the payments of its part of the day', () => {
    expect(realVsEstimate(entries, PRESET_HABITS, payments, '2026-10-05', '2026-10-05', 'evening')).toEqual({
      real: { EUR: 12.5 },
      currency: 'EUR',
      payments: 1,
      estimate: 9,
    });
  });

  it('adds up a day, and keeps other currencies apart', () => {
    const week = realVsEstimate(entries, PRESET_HABITS, payments, '2026-10-05', '2026-10-11');
    expect(week.real).toEqual({ EUR: 59.3, GBP: 6.4 });
    expect(formatMoneys(week.real!, week.currency, 'en')).toBe('€59.30 + 6.40 GBP');
  });

  it('says nothing about real spending on days the statement does not cover', () => {
    expect(statementSpan(payments)).toEqual({ from: '2026-10-05', to: '2026-10-07' });
    expect(realVsEstimate(entries, PRESET_HABITS, payments, '2026-09-01', '2026-09-01').real).toBeNull();
    expect(realVsEstimate(entries, PRESET_HABITS, [], '2026-10-05', '2026-10-05').real).toBeNull();
  });

  it('shows the month by card, day by day, in its main currency', () => {
    const totals = monthTotals(entries, [], PRESET_HABITS, { year: 2026, month: 9 }, '2026-10-07', payments);
    expect(totals.card).toMatchObject({ total: 59.3, currency: 'EUR', estimate: 9 });
    expect(totals.card?.perDay.slice(3, 8)).toEqual([null, 57.2, 2.1, 0, null]);
    expect(moneyOf(payments)).toEqual({ EUR: 59.3, GBP: 6.4 });
  });
});

describe('estimated against spent, per habit', () => {
  const drinks = PRESET_HABITS.find((h) => h.id === 'drinks')!; // €3 a drink
  const cigarettes = PRESET_HABITS.find((h) => h.id === 'cigarettes')!; // €0.55 each
  const pay = (date: string, description: string, amount: number, currency = 'EUR') => ({
    at: `${date}T20:00:00`,
    date,
    amount,
    currency,
    description,
    kind: 'card' as const,
  });
  const payments = [
    pay('2026-10-05', 'De Republiek', 18),
    pay('2026-10-06', 'de  republiek ', 6.5),
    pay('2026-10-06', 'Albert Heijn', 42.1),
    pay('2026-10-07', 'Tabacaria', 5.5),
    pay('2026-10-07', 'Pret London', 6, 'GBP'),
  ];
  const entries = [entry('2026-10-05', 'evening', 4), entry('2026-10-06', 'evening', 2)];

  it('links merchants however their name is spelled, and unlinks them', () => {
    const links = linkMerchant({}, 'De Republiek', 'drinks');
    expect(links).toEqual({ 'de republiek': 'drinks' });
    expect(linkMerchant(links, ' DE  REPUBLIEK', null)).toEqual({});
    expect(parseMerchantLinks({ 'Bar X ': 'drinks', '': 'x', y: 3 })).toEqual({ 'bar x': 'drinks' });
  });

  it('puts each habit’s estimate beside what its merchants really took', () => {
    const links = { ...linkMerchant({}, 'De Republiek', 'drinks'), tabacaria: 'cigarettes' };
    const result = spendingByCategory(entries, PRESET_HABITS, payments, links, '2026-10-05', '2026-10-11')!;
    expect(result.categories).toEqual([
      { habit: drinks, estimate: 18, spent: 24.5 },
      { habit: cigarettes, estimate: 0, spent: 5.5 },
    ]);
    expect(result.unlinked).toBe(42.1);
    // Euros only: estimates are in euros.
    expect(result.merchants.map((m) => [m.name, m.total, m.count, m.habitId])).toEqual([
      ['Albert Heijn', 42.1, 1, null],
      ['De Republiek', 24.5, 2, 'drinks'],
      ['Tabacaria', 5.5, 1, 'cigarettes'],
    ]);
  });

  it('shows estimates alone until merchants are linked, and nothing outside the statement', () => {
    const unlinked = spendingByCategory(entries, PRESET_HABITS, payments, {}, '2026-10-05', '2026-10-11')!;
    expect(unlinked.categories).toEqual([{ habit: drinks, estimate: 18, spent: 0 }]);
    expect(unlinked.unlinked).toBe(72.1);
    expect(spendingByCategory(entries, PRESET_HABITS, payments, {}, '2026-09-01', '2026-09-07')).toBeNull();
  });

  it('lets any habit take a merchant, with no estimate for habits without a price', () => {
    const making = PRESET_HABITS.find((h) => h.id === 'making')!;
    const links = linkMerchant({}, 'Albert Heijn', 'making');
    const result = spendingByCategory(entries, PRESET_HABITS, payments, links, '2026-10-05', '2026-10-11')!;
    expect(result.categories).toEqual([
      { habit: making, estimate: null, spent: 42.1 },
      { habit: drinks, estimate: 18, spent: 0 },
    ]);
  });

  it('links a merchant to at most one habit: linking again moves it', () => {
    const once = linkMerchant({}, 'De Republiek', 'drinks');
    expect(linkMerchant(once, 'de republiek', 'friend')).toEqual({ 'de republiek': 'friend' });
  });

  it('keeps links in the settings, and in backups', () => {
    const links = { 'de republiek': 'drinks' };
    expect(parseSettings({ merchantHabits: links }).merchantHabits).toEqual(links);
    expect(settingsForBackup(parseSettings({ merchantHabits: links }))?.merchantHabits).toEqual(links);
  });
});
