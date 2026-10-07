import { describe, expect, it } from '@jest/globals';
import { changeText } from '@ui/foundation/i18n/balance';

import { parseEntry } from '@domain/checkins/entries';
import { parseExport, serializeExport } from '@domain/checkins/exportFormat';
import { balanceDays } from '@domain/habits/balance';
import {
  URGE_POINTS,
  Urge,
  applyUrgeFloors,
  feelingsBefore,
  mergeUrges,
  parseUrges,
  toggleFeeling,
  urgeFloors,
  urgeForecast,
} from '@domain/habits/urges';
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
  isWin,
  sameLog,
  toggleOption,
  updateHabit,
  addOption,
  removeOption,
  parsePrice,
} from '@domain/habits/habits';
import { burstEmojis, VOICES } from '@ui/foundation/voices/voices';
import {
  describeLog,
  dosesByDay,
  habitWeek,
  recentInsteadNotes,
  savings,
  savingsMilestone,
  totalSavings,
} from '@domain/habits/insights';
import { describeHabitWeek, promptHabitText } from '@ui/foundation/i18n/habits';
import { formatEuros } from '@ui/foundation/i18n/format';

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
    expect(activeHabits(PRESET_HABITS, 'grow').map((h) => h.id)).toEqual([
      'water',
      'walk',
      'friend',
      'making',
    ]);
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
    expect(savingsMilestone(3)).toEqual({ reached: null, next: 5, progress: 0.6 });
    expect(savingsMilestone(60)).toEqual({ reached: 50, next: 100, progress: 0.6 });
    expect(savingsMilestone(1000)).toEqual({ reached: 600, next: null, progress: 1 });
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
    expect(describeHabitWeek(week[0])).toBe('🍺 Drinks: not logged');
  });
});

describe('habits with options', () => {
  const making = PRESET_HABITS.find((h) => h.id === 'making')!;

  it('offer the activities to spend time on', () => {
    expect(making.options!.map((o) => o.id)).toEqual([
      'cooking',
      'cleaning',
      'carpentry',
      'laundry',
      'drawing',
      'painting',
      'dancing',
      'music',
    ]);
  });

  it('count as done while any option is picked', () => {
    let log = toggleOption({ doses: {}, did: [] }, 'making', 'cooking');
    log = toggleOption(log, 'making', 'drawing');
    expect(log).toMatchObject({ did: ['making'], chosen: { making: ['cooking', 'drawing'] } });
    log = toggleOption(toggleOption(log, 'making', 'cooking'), 'making', 'drawing');
    expect(log.did).toEqual([]);
    expect(cleanLog(log)).toBeUndefined();
  });

  it('round-trip through parsing and read well', () => {
    const log = { doses: {}, did: ['making'], chosen: { making: ['cooking', 'painting'] } };
    expect(parseHabitLog(log)).toEqual(log);
    expect(parseHabitLog({ ...log, chosen: { making: 'cooking' } })).toBeNull();
    expect(describeLog(log, PRESET_HABITS)).toBe('🛠️🍳🎨');
    expect(promptHabitText(log, PRESET_HABITS)).toBe('did: time doing something (cooking, painting)');
  });

  it('drop picks for habits not marked done', () => {
    expect(cleanLog({ doses: {}, did: ['walk'], chosen: { making: ['cooking'] } })).toEqual({
      doses: {},
      did: ['walk'],
    });
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

describe('wins', () => {
  it('are a zero, a good habit, or a note on what you did instead', () => {
    expect(isWin(smoked(0))).toBe(true);
    expect(isWin(smoked(3))).toBe(false);
    expect(isWin({ doses: {}, did: ['walk'] })).toBe(true);
    expect(isWin({ doses: {}, did: [], instead: 'tea and a book' })).toBe(true);
    expect(isWin(undefined)).toBe(false);
  });

  it('add a sprout to the save burst, even on a low day', () => {
    expect(burstEmojis(VOICES.plain, 5, true)).toContain('🌱');
    expect(burstEmojis(VOICES.plain, 2, true)).toEqual(['🌱']);
    expect(burstEmojis(VOICES.plain, 2, false)).toEqual([]);
  });
});

describe('editing habits', () => {
  it('updates one habit only', () => {
    const next = updateHabit(PRESET_HABITS, 'drinks', { usualPerDay: 3, archived: true });
    expect(next.find((h) => h.id === 'drinks')).toMatchObject({ usualPerDay: 3, archived: true });
    expect(next.filter((h) => h.id !== 'drinks')).toEqual(PRESET_HABITS.filter((h) => h.id !== 'drinks'));
  });

  it('adds and removes options with unique ids', () => {
    const making = PRESET_HABITS.find((h) => h.id === 'making')!;
    const withGarden = addOption(making, ' Gardening ', '🌻');
    expect(withGarden.options!.at(-1)).toEqual({ id: 'gardening', label: 'Gardening', emoji: '🌻' });
    expect(addOption(withGarden, 'Gardening', '').options!.at(-1)).toEqual({
      id: 'gardening-2',
      label: 'Gardening',
      emoji: '•',
    });
    expect(addOption(making, '   ', '🌻')).toBe(making);
    expect(removeOption(withGarden, 'gardening').options).toEqual(making.options);
  });

  it('reads prices typed with a comma or a dot', () => {
    expect(parsePrice('0,55')).toBe(0.55);
    expect(parsePrice('€ 5')).toBe(5);
    expect(parsePrice('3.333')).toBe(3.33);
    expect(parsePrice('')).toBeUndefined();
  });
});

describe('urges', () => {
  const urge = (outcome: 'passed' | 'gaveIn', at: string): Urge => ({
    date: '2026-10-01',
    habitId: 'cigarettes',
    outcome,
    recordedAt: `2026-10-01T${at}.000Z`,
  });

  it('count as light points only when they passed', () => {
    const days = balanceDays(
      [],
      PRESET_HABITS,
      ['2026-10-01'],
      [urge('passed', '09:00:00'), urge('gaveIn', '10:00:00')],
    );
    expect(days[0]).toMatchObject({ light: URGE_POINTS, heavy: 0, net: URGE_POINTS, logged: true });
  });

  it('never take points away when you had one', () => {
    const [day] = balanceDays([], PRESET_HABITS, ['2026-10-01'], [urge('gaveIn', '10:00:00')]);
    expect(day.net).toBe(0);
  });

  it('set a minimum dose for the slot they happened in', () => {
    const morning = (at: string) => ({
      ...urge('gaveIn', at),
      recordedAt: new Date(2026, 9, 1, 9).toISOString(),
    });
    const urges = [
      morning('a'),
      morning('b'),
      { ...urge('passed', 'c'), recordedAt: morning('c').recordedAt },
    ];
    const floors = urgeFloors(urges, '2026-10-01', 'morning');
    expect(floors).toEqual({ cigarettes: 2 });
    expect(urgeFloors(urges, '2026-10-01', 'evening')).toEqual({});
    const low = applyUrgeFloors({ doses: { cigarettes: { count: 1, approx: true } }, did: [] }, floors);
    expect(low.doses.cigarettes).toEqual({ count: 2, approx: true });
    expect(
      applyUrgeFloors({ doses: { cigarettes: { count: 5 } }, did: [] }, floors).doses.cigarettes.count,
    ).toBe(5);
    expect(applyUrgeFloors({ doses: {}, did: [] }, floors).doses.cigarettes.count).toBe(2);
  });

  it('merge without duplicates and parse safely', () => {
    const a = urge('passed', '09:00:00');
    expect(mergeUrges([a], [a, urge('gaveIn', '10:00:00')])).toHaveLength(2);
    expect(parseUrges([a, { ...a, outcome: 'nope' }, 'x', { ...a, date: 'bad' }])).toEqual([a]);
    expect(parseUrges(undefined)).toEqual([]);
  });

  it('survive an export round trip, and older files import without them', () => {
    const a = urge('passed', '09:00:00');
    expect(parseExport(serializeExport([], PRESET_HABITS, [a])).urges).toEqual([a]);
    const v2 = JSON.stringify({ format: 'mood-tracker-export', version: 2, exportedAt: '', entries: [] });
    expect(parseExport(v2).urges).toEqual([]);
  });
});

describe('what you did instead', () => {
  const instead = (date: string, slot: Entry['slot'], text: string, updatedAt?: string): Entry => ({
    ...entry(date, slot, 3, { doses: {}, did: [], instead: text }),
    ...(updatedAt ? { updatedAt } : {}),
  });

  it('shows the latest notes from this week, most recently written first', () => {
    const notes = recentInsteadNotes(
      [
        instead('2026-09-20', 'morning', 'too old'),
        instead('2026-09-30', 'morning', 'walked'),
        instead('2026-10-01', 'morning', 'read'),
        instead('2026-09-29', 'evening', 'called a friend', '2026-10-01T20:00:00.000Z'),
        entry('2026-10-01', 'evening', 4),
      ],
      '2026-10-01',
    );
    expect(notes).toEqual(['called a friend', 'read', 'walked']);
  });
});

describe('feelings before an urge', () => {
  const urge = (date: string, feelings?: unknown): unknown => ({
    date,
    habitId: 'alcohol',
    outcome: 'passed',
    recordedAt: `${date}T12:00:00.000Z`,
    ...(feelings === undefined ? {} : { feelings }),
  });

  it('keeps known feelings in a fixed order and drops the rest', () => {
    const [u] = parseUrges([urge('2026-10-05', ['shame', 'boredom', 'nope', 3])]);
    expect(u.feelings).toEqual(['boredom', 'shame']);
  });

  it('leaves feelings out when none were picked, so older urges still parse', () => {
    expect(parseUrges([urge('2026-10-05'), urge('2026-10-06', [])])).toEqual([
      expect.not.objectContaining({ feelings: expect.anything() }),
      expect.not.objectContaining({ feelings: expect.anything() }),
    ]);
  });

  it('toggles a feeling', () => {
    expect(toggleFeeling(['boredom'], 'restlessness')).toEqual(['restlessness', 'boredom']);
    expect(toggleFeeling(['restlessness', 'boredom'], 'boredom')).toEqual(['restlessness']);
  });

  it('counts feelings in a date range, most frequent first', () => {
    const urges = parseUrges([
      urge('2026-09-28', ['fear']),
      urge('2026-10-05', ['restlessness', 'boredom']),
      urge('2026-10-06', ['boredom']),
      urge('2026-10-13', ['boredom']),
    ]);
    expect(feelingsBefore(urges, '2026-10-05', '2026-10-11')).toEqual([
      { feeling: 'boredom', count: 2 },
      { feeling: 'restlessness', count: 1 },
    ]);
  });

  it('travels through the export file', () => {
    const urges = parseUrges([urge('2026-10-05', ['sadness', 'emptiness'])]);
    expect(parseExport(serializeExport([], [], urges)).urges[0].feelings).toEqual(['sadness', 'emptiness']);
  });
});

describe('urge forecast', () => {
  // Local times, so the hour is the phone's.
  const at = (date: string, time: string, feelings?: string[]) => ({
    date,
    habitId: 'drinks',
    outcome: 'passed',
    recordedAt: new Date(`${date}T${time}`).toISOString(),
    ...(feelings ? { feelings } : {}),
  });
  const now = new Date('2026-10-07T19:30:00');

  it('gives a heads-up when urges keep coming at this time of day', () => {
    const urges = parseUrges([
      at('2026-10-01', '18:10', ['boredom']),
      at('2026-10-03', '19:45', ['boredom', 'restlessness']),
      at('2026-10-05', '20:59', ['restlessness']),
      at('2026-10-06', '20:30', ['boredom']),
      at('2026-10-06', '12:00', ['fear']),
    ]);
    expect(urgeForecast(urges, now)).toEqual({ fromHour: 18, toHour: 21, count: 4, feeling: 'boredom' });
  });

  it('stays quiet without a pattern, or when the urges are old', () => {
    expect(urgeForecast(parseUrges([at('2026-10-01', '18:10'), at('2026-10-02', '19:10')]), now)).toBeNull();
    const old = parseUrges([at('2026-08-01', '18:10'), at('2026-08-02', '19:10'), at('2026-08-03', '20:10')]);
    expect(urgeForecast(old, now)).toBeNull();
  });

  it('has no feeling when none was named', () => {
    const urges = parseUrges([
      at('2026-10-01', '18:10'),
      at('2026-10-02', '19:10'),
      at('2026-10-03', '20:10'),
    ]);
    expect(urgeForecast(urges, now)?.feeling).toBeNull();
  });
});

describe('an earlier week in the habit cards', () => {
  it('counts savings only up to the end of that week', () => {
    const drinks = { ...PRESET_HABITS.find((h) => h.id === 'drinks')!, usualPerDay: 4 };
    const day = (date: string, count: number): Entry => ({
      date,
      slot: 'evening',
      mood: 3,
      recordedAt: `${date}T20:00:00.000Z`,
      habits: { doses: { drinks: { count } }, did: [] },
    });
    const entries = [day('2026-09-29', 1), day('2026-10-06', 0)];
    // Week of 28 September, seen from its Sunday: the later day doesn't count yet.
    expect(totalSavings(entries, [drinks], undefined, '2026-10-04')).toBe(9);
    expect(totalSavings(entries, [drinks])).toBe(21);
  });

  it('compares a past week with the week before', () => {
    expect(changeText(3, 'en', true)).toBe('+3 lighter than the week before');
    expect(changeText(3, 'en')).toBe('+3 lighter than last week');
  });
});
