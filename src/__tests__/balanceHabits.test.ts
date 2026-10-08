import { describe, expect, it } from '@jest/globals';

import { monthTotals } from '@domain/checkins/monthTotals';
import { Entry } from '@domain/checkins/types';
import { balanceDays, checkInPoints } from '@domain/habits/balance';
import {
  DEFAULT_RANGE,
  HABIT_KINDS,
  Habit,
  KIND_RULES,
  createHabit,
  inSweetSpot,
  isDayWin,
  parseHabits,
  periodStart,
  weightOf,
  withPeriod,
} from '@domain/habits/habits';
import { habitWeek } from '@domain/habits/insights';
import {
  describeHabitWeek,
  habitSummary,
  monthCaption,
  promptHabitWeek,
  sweetSpotHint,
} from '@ui/foundation/i18n/habits';

const coffee: Habit = {
  id: 'coffee',
  name: 'Coffee',
  emoji: '☕',
  kind: 'balance',
  unit: 'cups',
  range: { min: 1, max: 2 },
};
const entry = (date: string, slot: Entry['slot'], cups?: number, id = 'coffee'): Entry => ({
  date,
  slot,
  mood: 3,
  recordedAt: `${date}T08:00:00.000Z`,
  ...(cups === undefined ? {} : { habits: { doses: { [id]: { count: cups } }, did: [] } }),
});

describe('habits to balance', () => {
  it('has a rule for every kind', () => {
    expect(Object.keys(KIND_RULES).sort()).toEqual([...HABIT_KINDS].sort());
  });

  it('wins a day inside the sweet spot, not above or below', () => {
    expect([0, 1, 2, 3].map((n) => inSweetSpot(coffee, n))).toEqual([false, true, true, false]);
    expect(isDayWin(coffee, 2)).toBe(true);
    expect(isDayWin({ ...coffee, kind: 'reduce' }, 0)).toBe(true);
    expect(isDayWin({ ...coffee, kind: 'grow' }, 1)).toBe(true);
  });

  it('starts new ones with a default sweet spot and a unit', () => {
    const h = createHabit([], 'Coffee', '', 'balance');
    expect(h).toMatchObject({ kind: 'balance', unit: 'coffee', emoji: '⚖️', range: DEFAULT_RANGE });
    expect(weightOf(h)).toBe(2);
  });

  it('keeps them when parsing, and drops an impossible sweet spot', () => {
    expect(parseHabits([coffee])).toEqual([coffee]);
    expect(parseHabits([coffee, { ...coffee, id: 'tea', range: { min: 3, max: 1 } }])).toEqual([coffee]);
  });

  it('scores per day: light points in the sweet spot, never heavy points', () => {
    const entries = [
      entry('2026-10-05', 'morning', 1),
      entry('2026-10-05', 'evening', 1),
      entry('2026-10-06', 'morning', 4),
    ];
    expect(checkInPoints(entries[2].habits, [coffee])).toEqual({ light: 0, heavy: 0 });
    const [mon, tue] = balanceDays(entries, [coffee], ['2026-10-05', '2026-10-06']);
    expect(mon).toMatchObject({ light: 2, heavy: 0 });
    expect(tue).toMatchObject({ light: 0, heavy: 0 });
  });

  it('counts days in the sweet spot in the week, the prompt and the month', () => {
    const entries = [
      entry('2026-10-05', 'morning', 1),
      entry('2026-10-05', 'evening', 1),
      entry('2026-10-06', 'morning', 4),
      entry('2026-10-07', 'morning', 0),
    ];
    const [week] = habitWeek(entries, [coffee], '2026-10-07');
    expect(week).toMatchObject({ logged: 3, wins: 1, total: 6 });
    expect(describeHabitWeek(week)).toBe('☕ Coffee in your sweet spot 1 of 3 days');
    expect(promptHabitWeek(week)).toBe('Coffee: within my sweet spot of 1–2 cups a day on 1 of 3 days');
    expect(habitSummary(coffee)).toBe('To balance · 1–2 a day · 🌱 2');

    const totals = monthTotals(entries, [], [coffee], { year: 2026, month: 9 }, '2026-10-07');
    expect(totals.habits[0]).toMatchObject({ winDays: 1, total: 6 });
    expect(monthCaption(coffee, 6)).toBe('days in the sweet spot (1–2 a day) · 6 cups in all');
  });
});

describe('sweet spots per week or month', () => {
  // Up to 3 drinks a week, counted from Monday; 2026-10-05 is a Monday.
  const drinks: Habit = {
    id: 'drinks',
    name: 'Drinks',
    emoji: '🍷',
    kind: 'balance',
    unit: 'drinks',
    range: { min: 0, max: 3, per: 'week' },
  };
  const week = [
    entry('2026-10-04', 'evening', 3, 'drinks'), // last week's Sunday: not this week's cap
    entry('2026-10-05', 'evening', 2, 'drinks'),
    entry('2026-10-06', 'evening', 1, 'drinks'), // 3 so far: still at the cap
    entry('2026-10-07', 'evening', 1, 'drinks'), // 4: over
    entry('2026-10-08', 'evening', 0, 'drinks'), // still over for the rest of the week
  ];

  it('starts each period on its first day', () => {
    expect(periodStart('2026-10-08', 'day')).toBe('2026-10-08');
    expect(periodStart('2026-10-08', 'week')).toBe('2026-10-05');
    expect(periodStart('2026-10-08', 'month')).toBe('2026-10-01');
  });

  it('wins each day while the total so far stays at or under the cap', () => {
    const [week1] = habitWeek(week, [drinks], '2026-10-08');
    expect(week1).toMatchObject({ logged: 4, wins: 2, total: 4 });
    const days = balanceDays(week, [drinks], ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08']);
    expect(days.map((d) => d.light)).toEqual([2, 2, 0, 0]);
    expect(days.every((d) => d.heavy === 0)).toBe(true);
  });

  it('counts a monthly cap from the 1st, even in a week that started the month before', () => {
    const wine: Habit = { ...drinks, range: { min: 0, max: 4, per: 'month' } };
    const entries = [
      entry('2026-09-30', 'evening', 5, 'drinks'),
      entry('2026-10-01', 'evening', 3, 'drinks'),
      entry('2026-10-02', 'evening', 1, 'drinks'),
      entry('2026-10-03', 'evening', 1, 'drinks'),
    ];
    const totals = monthTotals(entries, [], [wine], { year: 2026, month: 9 }, '2026-10-08');
    expect(totals.habits[0]).toMatchObject({ winDays: 2, total: 5 });
    const [w] = habitWeek(entries, [wine], '2026-10-02');
    expect(w).toMatchObject({ logged: 3, wins: 2 });
  });

  it('keeps a weekly cap in a month that starts mid-week', () => {
    // Thursday 1 October: Monday to Wednesday were in September.
    const entries = [
      entry('2026-09-29', 'evening', 3, 'drinks'),
      entry('2026-10-01', 'evening', 1, 'drinks'),
    ];
    const totals = monthTotals(entries, [], [drinks], { year: 2026, month: 9 }, '2026-10-08');
    expect(totals.habits[0]).toMatchObject({ winDays: 0, total: 1 });
  });

  it('parses a period, and drops an unknown one or a cap past its limit', () => {
    const monthly: Habit = { ...drinks, id: 'm', range: { min: 0, max: 200, per: 'month' } };
    expect(parseHabits([drinks, monthly])).toEqual([drinks, monthly]);
    expect(
      parseHabits([
        drinks,
        { ...drinks, id: 'y', range: { min: 0, max: 3, per: 'year' } },
        { ...drinks, id: 'd', range: { min: 0, max: 200, per: 'day' } },
      ]),
    ).toEqual([drinks]);
  });

  it('brings the bounds within the new period when switching', () => {
    expect(withPeriod({ min: 150, max: 200, per: 'month' }, 'day')).toEqual({ min: 60, max: 60, per: 'day' });
    expect(withPeriod({ min: 1, max: 2 }, 'week')).toEqual({ min: 1, max: 2, per: 'week' });
  });

  it('says what the sweet spot is counted over', () => {
    expect(sweetSpotHint(drinks)).toBe('sweet spot 0–3 a week');
    expect(sweetSpotHint(drinks, 'pt-PT')).toBe('medida certa: 0–3 por semana');
    expect(habitSummary(drinks)).toBe('To balance · 0–3 a week · 🌱 2');
    expect(monthCaption(drinks, 4)).toBe('days in the sweet spot (0–3 a week) · 4 drinks in all');
  });
});
