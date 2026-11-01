import { describe, expect, it } from '@jest/globals';

import { Entry } from '@domain/checkins/types';
import { Habit, PRESET_HABITS, parseHabits, parseTags } from '@domain/habits/habits';
import { Urge, parseUrge } from '@domain/habits/urges';
import { availableData, missingData } from '@domain/habitModules/availability';
import {
  activeModules,
  containsKeyword,
  keywordCollisions,
  matchModules,
  urgeContextFor,
} from '@domain/habitModules/matching';
import { HabitModule, ModuleInput } from '@domain/habitModules/modules';
import {
  EMPTY_PREFERENCES,
  offFor,
  parseModulePreferences,
  stateOf,
  switchModule,
  withState,
} from '@domain/habitModules/preferences';
import { MODULES } from '@domain/habitModules/registry';
import { triggerEcology } from '@domain/habitModules/triggerEcology/analysis';
import {
  EMPTY_STATE,
  experimentResult,
  latestExperiment,
  parseTriggerEcologyState,
  startExperiment,
} from '@domain/habitModules/triggerEcology/experiments';
import { groupOf } from '@domain/habitModules/triggerEcology/triggers';
import { parseSettings, settingsForBackup } from '@domain/settings/settings';

const habit = (over: Partial<Habit> = {}): Habit => ({
  id: 'weed',
  name: 'Weed',
  emoji: '🌿',
  kind: 'reduce',
  unit: 'joints',
  ...over,
});

const entry = (
  date: string,
  slot: Entry['slot'],
  doses: number | null,
  mood: Entry['mood'] = 3,
  extra: Partial<Entry> = {},
): Entry => ({
  date,
  slot,
  mood,
  recordedAt: `${date}T12:00:00.000Z`,
  ...(doses === null ? {} : { habits: { doses: { weed: { count: doses } }, did: [] } }),
  ...extra,
});

/** A local time on a date, as an ISO timestamp, so slots come out the same in any time zone. */
const at = (date: string, hour: number) =>
  new Date(`${date}T${String(hour).padStart(2, '0')}:30:00`).toISOString();

const urge = (date: string, hour: number, outcome: Urge['outcome'], over: Partial<Urge> = {}): Urge => ({
  date,
  habitId: 'weed',
  outcome,
  recordedAt: at(date, hour),
  ...over,
});

describe('keyword matching', () => {
  it('ignores case and accents, and allows plurals', () => {
    expect(containsKeyword('WEED', 'weed')).toBe(true);
    expect(containsKeyword('Canábis', 'canabis')).toBe(true);
    expect(containsKeyword('Ganzas ao fim do dia', 'ganza')).toBe(true);
  });

  it('matches whole words only', () => {
    expect(containsKeyword('Tweed jacket', 'weed')).toBe(false);
    expect(containsKeyword('weedkiller', 'weed')).toBe(false);
  });

  it('matches multi-word keywords as a phrase', () => {
    expect(containsKeyword('late night snack', 'night snack')).toBe(true);
    expect(containsKeyword('night, then a snack', 'night snack')).toBe(false);
  });

  it('switches Trigger ecology on for weed or cannabis by id, name or tag', () => {
    const ids = (h: Habit) => activeModules(h).map((m) => m.id);
    expect(ids(habit())).toEqual(['trigger-ecology']);
    expect(ids(habit({ id: 'habit-3', name: 'Cannabis' }))).toEqual(['trigger-ecology']);
    expect(ids(habit({ id: 'evenings', name: 'Evenings', tags: ['cannabis'] }))).toEqual(['trigger-ecology']);
  });

  it('leaves other habits as they are', () => {
    for (const preset of PRESET_HABITS) expect(matchModules(preset)).toEqual([]);
  });

  it('only switches on for the kinds a module supports', () => {
    expect(activeModules(habit({ kind: 'grow' }))).toEqual([]);
    expect(activeModules(habit({ kind: 'balance' }))).toHaveLength(1);
  });

  it('keeps matching archived habits so their history can be read', () => {
    expect(activeModules(habit({ archived: true }))).toHaveLength(1);
  });

  it('switches on every module that matches, unless switched off for the habit', () => {
    const other: HabitModule = { ...MODULES['trigger-ecology'], id: 'other' as never, keywords: ['weed'] };
    const all = [MODULES['trigger-ecology'], other];
    expect(activeModules(habit(), [], all).map((m) => m.id)).toEqual(['trigger-ecology', 'other']);
    expect(matchModules(habit(), ['trigger-ecology'], all).map((m) => m.on)).toEqual([false, true]);
    expect(keywordCollisions(all)).toEqual({ weed: ['trigger-ecology', 'other'] });
  });

  it('has no keyword shared by two registered modules (add it here when one is meant to be)', () => {
    expect(keywordCollisions()).toEqual({});
  });

  it('asks for urge context only for habits a module collects it for', () => {
    expect(urgeContextFor(habit())).toContain('alone');
    expect(urgeContextFor(habit(), ['trigger-ecology'])).toEqual([]);
    expect(urgeContextFor(PRESET_HABITS[0])).toEqual([]);
  });
});

describe('habit tags', () => {
  it('parses typed tags', () => {
    expect(parseTags(' cannabis, Erva ,, cannabis,erva')).toEqual(['cannabis', 'Erva']);
  });

  it('are kept with the habit, and older habits without them still load', () => {
    expect(parseHabits([habit({ tags: ['erva'] })])[0].tags).toEqual(['erva']);
    expect(parseHabits([habit()])[0].tags).toBeUndefined();
    expect(parseHabits([habit({ tags: 'erva' as never })])).toEqual(PRESET_HABITS);
  });
});

describe('urge context', () => {
  it('is optional and only known values are kept', () => {
    const raw = {
      date: '2026-10-01',
      habitId: 'weed',
      outcome: 'passed',
      recordedAt: '2026-10-01T10:00:00Z',
    };
    expect(parseUrge(raw)).toEqual(raw);
    expect(parseUrge({ ...raw, context: ['alone', 'nope'] })?.context).toEqual(['alone']);
  });
});

describe('module preferences', () => {
  it('switches modules off and on per habit', () => {
    const off = switchModule(EMPTY_PREFERENCES, 'weed', 'trigger-ecology', false);
    expect(offFor(off, 'weed')).toEqual(['trigger-ecology']);
    expect(switchModule(off, 'weed', 'trigger-ecology', true).off).toEqual({});
  });

  it('drops unknown modules and lets each module parse its own state', () => {
    const prefs = parseModulePreferences({
      off: { weed: ['trigger-ecology', 'gone'] },
      state: { 'trigger-ecology': { experiments: 'nope' }, gone: {} },
    });
    expect(prefs.off).toEqual({ weed: ['trigger-ecology'] });
    expect(prefs.state).toEqual({ 'trigger-ecology': EMPTY_STATE });
    expect(parseModulePreferences(null)).toEqual(EMPTY_PREFERENCES);
  });

  it('live in settings and travel in backups', () => {
    const prefs = withState(EMPTY_PREFERENCES, 'trigger-ecology', EMPTY_STATE);
    const settings = parseSettings({ habitModules: prefs });
    expect(stateOf(settings.habitModules, 'trigger-ecology')).toEqual(EMPTY_STATE);
    expect(settingsForBackup(settings)?.habitModules).toEqual(prefs);
    expect(parseSettings({}).habitModules).toEqual(EMPTY_PREFERENCES);
  });
});

describe('data requirements', () => {
  const input = (entries: Entry[], urges: Urge[] = []): ModuleInput => ({
    habit: habit(),
    entries,
    urges,
    today: '2026-10-31',
  });

  it('says what is missing instead of failing', () => {
    const module = MODULES['trigger-ecology'];
    expect(missingData(module, input([])).required).toEqual(['doses']);
    const some = input([entry('2026-10-30', 'evening', 1)]);
    expect(missingData(module, some)).toEqual({
      required: [],
      optional: ['urges', 'feelings', 'context', 'sleep'],
    });
    expect(availableData(some).moods).toBe(true);
  });
});

describe('trigger ecology', () => {
  const today = '2026-10-31'; // a Saturday
  const entries: Entry[] = [
    entry('2026-10-29', 'morning', 0, 4, { sleep: { hours: 8 } }),
    entry('2026-10-29', 'evening', 2, 3),
    entry('2026-10-30', 'morning', 0, 2, { sleep: { hours: 5 } }),
    entry('2026-10-30', 'afternoon', 0, 4),
    entry('2026-10-30', 'evening', 3, 3),
    entry('2026-10-31', 'morning', 0, 3, { sleep: { hours: 6.5 } }),
  ];
  const urges: Urge[] = [
    urge('2026-10-29', 20, 'gaveIn', { feelings: ['boredom'], context: ['alone', 'home'] }),
    urge('2026-10-30', 20, 'gaveIn', { feelings: ['boredom', 'tiredness'], context: ['alone'] }),
    urge('2026-10-30', 15, 'passed', { feelings: ['boredom'], context: ['out'] }),
    urge('2026-10-30', 21, 'passed', { habitId: 'cigarettes', feelings: ['anger'] }),
  ];
  const report = triggerEcology({ habit: habit(), entries, urges, today });

  it('groups triggers into emotional, environmental and physiological', () => {
    expect(groupOf('feeling:boredom')).toBe('emotional');
    expect(groupOf('context:alone')).toBe('environmental');
    expect(groupOf('feeling:tiredness')).toBe('physiological');
    expect(groupOf('sleep:shortNight')).toBe('physiological');
    expect(report.triggers.emotional).toEqual([{ key: 'feeling:boredom', urges: 3, passed: 1 }]);
    expect(report.triggers.environmental[0]).toEqual({ key: 'context:alone', urges: 2, passed: 0 });
    // The 30th followed a 5-hour night.
    expect(report.triggers.physiological.map((t) => t.key).sort()).toEqual([
      'feeling:tiredness',
      'sleep:shortNight',
    ]);
  });

  it('only reads urges for its own habit', () => {
    expect(report.urgesAndDoses?.urges).toBe(3);
  });

  it('finds triggers that come together', () => {
    expect(report.combinations[0]).toEqual({ a: 'context:alone', b: 'feeling:boredom', urges: 2, passed: 0 });
  });

  it('tells doses after a pause from doses with none', () => {
    // Two evenings, one urge each that took the best of you: 1 + 1 after a pause, the rest without.
    expect(report.pauses).toEqual({ afterPause: 2, noPause: 3, passed: 1 });
  });

  it('compares days with urges and days without', () => {
    expect(report.urgesAndDoses).toMatchObject({ onUrgeDays: 2.5, onOtherDays: 0 });
  });

  it('finds the busiest weekday and part of the day', () => {
    expect(report.rhythm?.busiestWeekday).toBe(4); // Friday
    expect(report.rhythm?.busiestSlot).toBe('evening');
    expect(report.rhythm?.urgesBySlot).toEqual({ morning: 0, afternoon: 1, evening: 2 });
  });

  it('compares mood and sleep after check-ins with doses and with none', () => {
    expect(report.beforeAfter).toMatchObject({
      moodWithSome: 3,
      nextMoodAfterSome: 2.5, // the next mornings: 2 and 3
      sleepAfterSome: 5.75, // nights after the 29th and 30th
    });
  });

  it('degrades to empty parts with no data', () => {
    const empty = triggerEcology({ habit: habit(), entries: [], urges: [], today });
    expect(empty).toMatchObject({
      urgesAndDoses: null,
      pauses: null,
      rhythm: null,
      beforeAfter: null,
      combinations: [],
    });
    expect(empty.triggers).toEqual({ emotional: [], environmental: [], physiological: [] });
  });
});

describe('experiments', () => {
  const x = {
    habitId: 'weed',
    trigger: 'feeling:boredom' as const,
    plan: ' walk first ',
    startedOn: '2026-10-25',
    days: 7,
  };

  it('keep one running experiment per habit', () => {
    const one = startExperiment(EMPTY_STATE, x);
    expect(latestExperiment(one, 'weed')?.plan).toBe('walk first');
    const two = startExperiment(one, { ...x, startedOn: '2026-10-28' });
    expect(two.experiments).toHaveLength(1);
    expect(parseTriggerEcologyState(two)).toEqual(two);
    expect(parseTriggerEcologyState({ experiments: [{ ...x, trigger: 'nope' }] })).toEqual(EMPTY_STATE);
  });

  it('compare the days so far with as many days before', () => {
    const entries = [entry('2026-10-20', 'evening', 4), entry('2026-10-26', 'evening', 1)];
    const urges = [
      urge('2026-10-21', 20, 'gaveIn', { feelings: ['boredom'] }),
      urge('2026-10-26', 20, 'passed', { feelings: ['boredom'] }),
    ];
    const result = experimentResult(x, { habit: habit(), entries, urges, today: '2026-10-27' });
    expect(result).toMatchObject({ day: 3, finished: false });
    expect(result.before).toMatchObject({
      from: '2026-10-18',
      to: '2026-10-24',
      dosesPerDay: 4,
      triggerUrges: 1,
      triggerPassed: 0,
    });
    expect(result.during).toMatchObject({
      from: '2026-10-25',
      to: '2026-10-27',
      dosesPerDay: 1,
      triggerUrges: 1,
      triggerPassed: 1,
    });
    expect(experimentResult(x, { habit: habit(), entries, urges, today: '2026-11-05' }).finished).toBe(true);
  });
});
