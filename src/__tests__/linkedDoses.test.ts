import { describe, expect, it } from '@jest/globals';

import { Habit } from '@domain/habits/habits';
import { linkMerchant } from '@domain/spending/categories';
import { linkedDoses, prefillLinkedDoses } from '@domain/spending/linkedDoses';
import { Payment } from '@domain/spending/payments';

const drinks: Habit = {
  id: 'drinks',
  name: 'Drinks',
  emoji: '🍺',
  kind: 'reduce',
  unit: 'drinks',
  pricePerDose: 3,
};
const coffee: Habit = { id: 'coffee', name: 'Coffee', emoji: '☕', kind: 'balance', unit: 'cups' };
const walk: Habit = { id: 'walk', name: 'Walk', emoji: '🚶', kind: 'grow', unit: '' };
const habits = [drinks, coffee, walk];

const pay = (at: string, amount: number, description: string, currency = 'EUR'): Payment => ({
  at,
  date: at.slice(0, 10),
  amount,
  currency,
  description,
  kind: 'card',
});

let links = linkMerchant({}, 'Bar O Tasco', 'drinks');
links = linkMerchant(links, 'Padaria Central', 'coffee');
links = linkMerchant(links, 'Decathlon', 'walk');

const payments = [
  pay('2026-10-05T08:15:00', 1.6, 'Padaria Central'), // morning
  pay('2026-10-05T08:40:00', 1.6, 'padaria  central'), // same merchant, any case or spacing
  pay('2026-10-05T19:10:00', 7.5, 'Bar O Tasco'), // evening
  pay('2026-10-05T23:30:00', 2, 'Bar O Tasco'),
  pay('2026-10-05T21:00:00', 40, 'Supermarket'), // not linked
  pay('2026-10-05T20:00:00', 30, 'Decathlon'), // linked to a habit to grow: not doses
  pay('2026-10-06T20:00:00', 4, 'Bar O Tasco'), // another day
];

describe('doses from linked payments', () => {
  it('suggests euros ÷ price for the check-in the payments fall in', () => {
    expect(linkedDoses(payments, links, habits, '2026-10-05', 'evening')).toEqual({
      drinks: { count: 3, payments: 2 }, // €9.50 ÷ €3
    });
  });

  it('counts one per payment without a price', () => {
    expect(linkedDoses(payments, links, habits, '2026-10-05', 'morning')).toEqual({
      coffee: { count: 2, payments: 2 },
    });
  });

  it('counts at least 1, and 1 per payment in another currency', () => {
    const small = [
      pay('2026-10-05T19:00:00', 1, 'Bar O Tasco'),
      pay('2026-10-05T20:00:00', 8, 'Bar O Tasco', 'GBP'),
    ];
    expect(linkedDoses(small, links, habits, '2026-10-05', 'evening')).toEqual({
      drinks: { count: 2, payments: 2 },
    });
  });

  it('suggests nothing for unlinked merchants, archived habits or other days', () => {
    expect(linkedDoses(payments, links, habits, '2026-10-05', 'afternoon')).toEqual({});
    expect(linkedDoses(payments, links, [{ ...drinks, archived: true }], '2026-10-05', 'evening')).toEqual(
      {},
    );
    expect(linkedDoses(payments, {}, habits, '2026-10-05', 'evening')).toEqual({});
  });

  it('prefills only habits not logged yet, as rough', () => {
    const suggested = { drinks: { count: 3, payments: 2 }, coffee: { count: 2, payments: 2 } };
    const log = { doses: { drinks: { count: 1 } }, did: [] };
    expect(prefillLinkedDoses(log, suggested)).toEqual({
      doses: { drinks: { count: 1 }, coffee: { count: 2, approx: true } },
      did: [],
    });
    expect(prefillLinkedDoses(log, {})).toBe(log);
  });
});
