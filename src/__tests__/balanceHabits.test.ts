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
  weightOf,
} from '@domain/habits/habits';
import { habitWeek } from '@domain/habits/insights';
import { describeHabitWeek, habitSummary, monthCaption, promptHabitWeek } from '@ui/foundation/i18n/habits';

const coffee: Habit = {
  id: 'coffee',
  name: 'Coffee',
  emoji: '☕',
  kind: 'balance',
  unit: 'cups',
  range: { min: 1, max: 2 },
};
const entry = (date: string, slot: Entry['slot'], cups?: number): Entry => ({
  date,
  slot,
  mood: 3,
  recordedAt: `${date}T08:00:00.000Z`,
  ...(cups === undefined ? {} : { habits: { doses: { coffee: { count: cups } }, did: [] } }),
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
    expect(monthCaption(coffee, 6)).toBe('days in the sweet spot (1–2) · 6 cups in all');
  });
});
