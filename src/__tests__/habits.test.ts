import { describe, expect, it } from '@jest/globals';

import { parseEntry } from '@domain/checkins/entries';
import { Entry } from '@domain/checkins/types';
import {
  Habit,
  PRESET_HABITS,
  activeHabits,
  cleanLog,
  createHabit,
  mergeHabits,
  parseHabitLog,
  parseHabits,
  sameLog,
} from '@domain/habits/habits';
import {
  describeHabitWeek,
  describeLog,
  dosesByDay,
  formatEuros,
  habitWeek,
  promptHabitText,
  savings,
  savingsMilestone,
  totalSavings,
} from '@domain/habits/insights';

const today = '2026-10-01';
const cigarettes: Habit = { ...PRESET_HABITS[0], usualPerDay: 10 }; // €0.55 each
const entry = (date: string, slot: Entry['slot'], mood: Entry['mood'], habits?: Entry['habits']): Entry => ({
  date,
  slot,
  mood,
  recordedAt: `${date}T08:00:00.000Z`,
  ...(habits ? { habits } : {}),
});
const smoked = (count: number, approx = false) => ({
  doses: { cigarettes: approx ? { count, approx } : { count } },
  did: [],
});

describe('presets', () => {
  it('reduce cigarettes, weed and drinks, and grow water, walks and connecting with a friend', () => {
    expect(activeHabits(PRESET_HABITS, 'reduce').map((h) => h.id)).toEqual(['cigarettes', 'weed', 'drinks']);
    expect(activeHabits(PRESET_HABITS, 'grow').map((h) => h.id)).toEqual(['water', 'walk', 'friend']);
  });

  it('come with Dutch prices for the habits to reduce', () => {
    expect(PRESET_HABITS.filter((h) => h.kind === 'reduce').every((h) => (h.pricePerDose ?? 0) > 0)).toBe(
      true,
    );
  });
});

describe('habit logs', () => {
  it('parse doses, roughly-remembered doses, grown habits and the instead note', () => {
    const log = {
      doses: { cigarettes: { count: 2, approx: true }, drinks: { count: 0 } },
      did: ['walk'],
      instead: ' a walk ',
    };
    expect(parseHabitLog(log)).toEqual({ ...log, instead: 'a walk' });
  });

  it('treat an empty log as nothing logged, not as invalid', () => {
    expect(parseHabitLog({ doses: {}, did: [] })).toBeUndefined();
    expect(parseEntry({ ...entry(today, 'morning', 3), habits: { doses: {}, did: [] } })).toEqual(
      entry(today, 'morning', 3),
    );
  });

  it('reject bad doses', () => {
    expect(parseHabitLog({ doses: { x: { count: -1 } }, did: [] })).toBeNull();
    expect(parseHabitLog({ doses: { x: { count: 1.5 } }, did: [] })).toBeNull();
    expect(parseHabitLog({ doses: { x: { count: 100 } }, did: [] })).toBeNull();
    expect(parseEntry({ ...entry(today, 'morning', 3), habits: { doses: [], did: [] } })).toBeNull();
  });

  it('compare by content and drop duplicates', () => {
    expect(sameLog(smoked(2), { doses: { cigarettes: { count: 2 } }, did: [], instead: '  ' })).toBe(true);
    expect(sameLog(smoked(2), smoked(3))).toBe(false);
    expect(cleanLog({ doses: {}, did: ['walk', 'walk'] })).toEqual({ doses: {}, did: ['walk'] });
  });
});

describe('habit definitions', () => {
  it('fall back to presets and drop invalid or duplicate ones', () => {
    expect(parseHabits(undefined)).toBe(PRESET_HABITS);
    expect(
      parseHabits([
        { id: 'a', name: 'A', emoji: '•', kind: 'reduce', unit: 'a' },
        { id: 'a' },
        { id: 'b', kind: 'other' },
      ]),
    ).toEqual([{ id: 'a', name: 'A', emoji: '•', kind: 'reduce', unit: 'a' }]);
  });

  it('merge a backup without overriding your own', () => {
    const mine = [{ ...PRESET_HABITS[0], name: 'Smokes' }];
    const merged = mergeHabits(mine, PRESET_HABITS);
    expect(merged[0].name).toBe('Smokes');
    expect(merged).toHaveLength(PRESET_HABITS.length);
  });

  it('get a unique id when created', () => {
    expect(createHabit(PRESET_HABITS, '  Coffee ', '☕', 'reduce')).toEqual({
      id: 'coffee',
      name: 'Coffee',
      emoji: '☕',
      kind: 'reduce',
      unit: 'coffee',
    });
    expect(createHabit(PRESET_HABITS, 'Walk', '', 'grow').id).toBe('walk-2');
  });
});

describe('savings', () => {
  const entries = [
    entry('2026-09-29', 'morning', 3, smoked(3)),
    entry('2026-09-29', 'evening', 3, smoked(2)), // day total 5 → 5 fewer than usual
    entry('2026-09-30', 'evening', 2, smoked(12)), // more than usual → saves 0, never negative
    entry('2026-10-01', 'morning', 4, smoked(0)), // none → 10 fewer
    entry('2026-09-28', 'morning', 3), // not logged → doesn't count
  ];

  it('count logged days only, by day', () => {
    expect([...dosesByDay(entries, 'cigarettes')]).toEqual([
      ['2026-09-29', 5],
      ['2026-09-30', 12],
      ['2026-10-01', 0],
    ]);
  });

  it('add up (usual − actual) × price and never go negative', () => {
    expect(savings(entries, cigarettes)).toBeCloseTo(15 * 0.55);
    expect(savings(entries, cigarettes, '2026-10-01')).toBeCloseTo(5.5);
    expect(totalSavings(entries, [cigarettes, PRESET_HABITS[3]])).toBeCloseTo(8.25);
  });

  it('need both a price and a usual amount', () => {
    expect(savings(entries, { ...cigarettes, usualPerDay: undefined })).toBe(0);
    expect(savings(entries, { ...cigarettes, pricePerDose: undefined })).toBe(0);
  });

  it('turn into something real', () => {
    expect(savingsMilestone(3)).toMatchObject({ reached: null, next: { amount: 5 } });
    expect(savingsMilestone(60)).toMatchObject({
      reached: { amount: 50 },
      next: { amount: 100 },
      progress: 0.6,
    });
    expect(savingsMilestone(1000)).toMatchObject({ reached: { amount: 600 }, next: null, progress: 1 });
    expect(formatEuros(8.25)).toBe('€8.25');
    expect(formatEuros(12)).toBe('€12');
    expect(formatEuros(250.4)).toBe('€250');
  });
});

describe('weekly habit view', () => {
  const entries = [
    entry('2026-09-30', 'morning', 4, { doses: { cigarettes: { count: 0 } }, did: ['walk'] }),
    entry('2026-09-30', 'evening', 2, { doses: { cigarettes: { count: 4 } }, did: [] }),
    entry(today, 'morning', 4, { doses: { cigarettes: { count: 0 } }, did: ['walk', 'water'] }),
    entry('2026-09-20', 'morning', 1, { doses: { cigarettes: { count: 9 } }, did: [] }), // outside the week
  ];

  it('leads with wins and compares moods with none and with some', () => {
    const [cig, , , water, walk] = habitWeek(entries, [cigarettes, ...PRESET_HABITS.slice(1)], today);
    expect(cig).toMatchObject({ logged: 3, wins: 2, total: 4, moodWithNone: 4, moodWithSome: 2 });
    expect(describeHabitWeek(cig)).toBe('🚬 None in 2 of 3 check-ins · 4 cigarettes in all');
    expect(walk).toMatchObject({ logged: 3, wins: 2 });
    expect(describeHabitWeek(water)).toBe('💧 Water in 1 of 3 check-ins');
  });

  it('skips archived habits and says when nothing was logged', () => {
    const week = habitWeek([], [{ ...cigarettes, archived: true }, PRESET_HABITS[2]], today);
    expect(week).toHaveLength(1);
    expect(describeHabitWeek(week[0])).toBe('🍺 Drinks: not logged this week');
  });
});

describe('describing a check-in', () => {
  const log = {
    doses: { cigarettes: { count: 2, approx: true }, drinks: { count: 0 } },
    did: ['walk'],
    instead: 'called a friend',
  };

  it('as a short line of emojis', () => {
    expect(describeLog(log, PRESET_HABITS)).toBe('🚬 2≈ · 🍺 0 · 🚶');
    expect(describeLog(undefined, PRESET_HABITS)).toBe('');
  });

  it('as text for the Claude prompt', () => {
    expect(promptHabitText(log, PRESET_HABITS)).toBe(
      'about 2 cigarettes; 0 drinks; did: walk; instead: "called a friend"',
    );
  });
});
