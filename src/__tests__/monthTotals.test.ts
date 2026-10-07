import { describe, expect, it } from '@jest/globals';

import { monthTotals } from '@domain/checkins/monthTotals';
import { Entry } from '@domain/checkins/types';
import { PRESET_HABITS } from '@domain/habits/habits';
import { parseUrges } from '@domain/habits/urges';

const entry = (
  date: string,
  slot: Entry['slot'],
  mood: Entry['mood'],
  extra: Partial<Entry> = {},
): Entry => ({
  date,
  slot,
  mood,
  recordedAt: `${date}T10:00:00.000Z`,
  ...extra,
});

describe('month totals', () => {
  // October 2026, seen on the 7th.
  const october = { year: 2026, month: 9 };
  const today = '2026-10-07';
  const entries = [
    entry('2026-09-30', 'evening', 1, { steps: 9999 }), // another month
    entry('2026-10-01', 'morning', 4, { steps: 3000, unlocks: 20, sleep: { hours: 7 } }),
    entry('2026-10-01', 'evening', 2, {
      steps: 1000,
      habits: { doses: { drinks: { count: 2 } }, did: ['walk'] },
    }),
    entry('2026-10-03', 'morning', 3, {
      sleep: { hours: 8 },
      habits: { doses: { drinks: { count: 0 } }, did: [] },
    }),
  ];
  const urges = parseUrges([
    { date: '2026-10-02', habitId: 'drinks', outcome: 'passed', recordedAt: '2026-10-02T20:00:00Z' },
    { date: '2026-10-03', habitId: 'drinks', outcome: 'gaveIn', recordedAt: '2026-10-03T20:00:00Z' },
  ]);
  const totals = monthTotals(entries, urges, PRESET_HABITS, october, today);

  it('covers every day of the month', () => {
    expect(totals.days).toHaveLength(31);
    expect(totals.days[0]).toBe('2026-10-01');
  });

  it('counts check-ins against the days so far, and leaves the rest empty', () => {
    expect(totals.checkIns).toMatchObject({ count: 3, possible: 21, average: 3 });
    expect(totals.checkIns.perDay.slice(0, 8)).toEqual([2, 0, 1, 0, 0, 0, 0, null]);
  });

  it('adds up the phone signals, and sleep as an average', () => {
    expect(totals.steps?.total).toBe(4000);
    expect(totals.steps?.perDay.slice(0, 3)).toEqual([4000, null, null]);
    expect(totals.unlocks?.total).toBe(20);
    expect(totals.sleep).toMatchObject({ averageHours: 7.5, nights: 2 });
  });

  it('leads habits with wins and skips the ones never logged', () => {
    const drinks = totals.habits.find((h) => h.habit.id === 'drinks');
    expect(drinks).toMatchObject({ total: 2, winDays: 1 });
    expect(drinks?.perDay.slice(0, 3)).toEqual([2, null, 0]);
    expect(totals.habits.find((h) => h.habit.id === 'walk')).toMatchObject({ winDays: 1 });
    expect(totals.habits.find((h) => h.habit.id === 'cigarettes')).toBeUndefined();
  });

  it('counts urges', () => {
    expect(totals.urges).toMatchObject({ total: 2, passed: 1 });
    expect(totals.urges?.perDay.slice(0, 4)).toEqual([0, 1, 1, 0]);
  });

  it('has no signal rows for an empty month', () => {
    const empty = monthTotals([], [], PRESET_HABITS, october, today);
    expect(empty.steps).toBeNull();
    expect(empty.urges).toBeNull();
    expect(empty.habits).toEqual([]);
  });
});
