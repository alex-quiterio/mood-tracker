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
import { keyFindings, triggerEcology } from '@domain/habitModules/triggerEcology/analysis';
import {
  EMPTY_STATE,
  experimentResult,
  latestExperiment,
  parseTriggerEcologyState,
  startExperiment,
} from '@domain/habitModules/triggerEcology/experiments';
import { groupOf } from '@domain/habitModules/triggerEcology/triggers';
import { parseSettings, settingsForBackup } from '@domain/settings/settings';
import { compareMeans, compareRates, correlation, rate, sample } from '@domain/shared/statistics';

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
    expect(report.triggers.emotional.map((t) => [t.key, t.passed.hits, t.passed.n])).toEqual([
      ['feeling:boredom', 1, 3],
    ]);
    const alone = report.triggers.environmental[0];
    expect([alone.key, alone.passed.hits, alone.passed.n]).toEqual(['context:alone', 0, 2]);
    // Read against the one urge without it, which passed.
    expect(alone.versusOthers.b).toMatchObject({ hits: 1, n: 1 });
    expect(alone.versusOthers.evidence).toBe('tooFew');
    // The 30th followed a 5-hour night.
    expect(report.triggers.physiological.map((t) => t.key).sort()).toEqual([
      'feeling:tiredness',
      'sleep:shortNight',
    ]);
  });

  it('only reads urges for its own habit', () => {
    expect(report.overall).toMatchObject({ hits: 1, n: 3 });
  });

  it('finds triggers that come together', () => {
    expect(report.combinations[0]).toMatchObject({
      a: 'context:alone',
      b: 'feeling:boredom',
      passed: { hits: 0, n: 2 },
    });
  });

  it('tells doses after a pause from doses with none', () => {
    // Two evenings, one urge each that took the best of you: 1 + 1 after a pause, the rest without.
    expect(report.pauses).toEqual({ afterPause: 2, noPause: 3, passed: 1 });
  });

  it('compares days with urges and days without', () => {
    expect(report.urgeDays.a).toMatchObject({ n: 2, mean: 2.5 });
    expect(report.urgeDays.b).toMatchObject({ n: 1, mean: 0 });
    expect(report.urgeDays.evidence).toBe('tooFew');
  });

  it('finds the busiest weekday and part of the day', () => {
    expect(report.rhythm?.busiestWeekday).toBe(4); // Friday
    expect(report.rhythm?.busiestSlot).toBe('evening');
    expect(report.rhythm?.urgesBySlot).toEqual({ morning: 0, afternoon: 1, evening: 2 });
    expect(report.rhythm?.grid[4][2]).toEqual({ mean: 3, n: 1 }); // Friday evening
    expect(report.rhythm?.grid[0][0]).toEqual({ mean: null, n: 0 });
  });

  it('compares mood and sleep after check-ins with doses and with none', () => {
    expect(report.after?.mood.a.mean).toBe(3);
    expect(report.after?.nextMood.a.mean).toBe(2.5); // the next mornings: 2 and 3
    expect(report.after?.sleep.a.mean).toBe(5.75); // nights after the 29th and 30th
  });

  it('pairs doses with the sleep before and the mood of the day', () => {
    expect(report.links.sleep.points).toEqual([
      { x: 8, y: 2 },
      { x: 5, y: 3 },
      { x: 6.5, y: 0 },
    ]);
    expect(report.links.sleep.evidence).toBe('tooFew');
    expect(report.links.steps.n).toBe(0);
    expect(report.links.mood.n).toBe(3);
  });

  it('keeps only clear findings for the overview, biggest first', () => {
    expect(keyFindings(report)).toEqual([]); // three urges can't show anything clearly
    const many: Urge[] = [
      ...Array.from({ length: 8 }, (_, i) =>
        urge(`2026-10-${10 + i}`, 20, 'gaveIn', { feelings: ['boredom'] }),
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        urge(`2026-10-${10 + i}`, 10, 'passed', { feelings: ['anxiety'] }),
      ),
    ];
    const found = keyFindings(triggerEcology({ habit: habit(), entries: [], urges: many, today }));
    expect(found.map((f) => f.kind === 'trigger' && [f.key, Math.sign(f.difference)])).toEqual([
      ['feeling:boredom', -1],
      ['feeling:anxiety', 1],
    ]);
  });

  it('gives every day of the window, logged or not', () => {
    expect(report.daily).toHaveLength(56);
    expect(report.daily.at(-1)).toEqual({ date: today, doses: 0, urges: 0, passed: 0 });
    expect(report.daily.at(-2)).toEqual({ date: '2026-10-30', doses: 3, urges: 2, passed: 1 });
    expect(report.daily[0]).toEqual({ date: '2026-09-06', doses: null, urges: 0, passed: 0 });
  });

  it('degrades to empty parts with no data', () => {
    const empty = triggerEcology({ habit: habit(), entries: [], urges: [], today });
    expect(empty).toMatchObject({
      pauses: null,
      rhythm: null,
      after: null,
      combinations: [],
    });
    expect(empty.urgeDays.evidence).toBe('tooFew');
    expect(empty.overall.interval).toBeNull();
    expect(empty.links.sleep).toMatchObject({ n: 0, rho: null, evidence: 'tooFew' });
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

describe('statistics', () => {
  const close = (x: number | undefined, y: number) => expect(x).toBeCloseTo(y, 3);

  it('gives a mean its t interval', () => {
    const s = sample([2, 4, 6]);
    expect(s.mean).toBe(4);
    close(s.interval?.low, 4 - 4.303 * (2 / Math.sqrt(3)));
    expect(sample([5]).interval).toBeNull();
  });

  it("compares two means with Welch's interval", () => {
    const c = compareMeans([1, 2, 3], [4, 5, 6]);
    close(c.difference?.estimate, -3);
    close(c.difference?.low, -3 - 2.776 * Math.sqrt(2 / 3)); // 4 degrees of freedom
    expect(c.evidence).toBe('clear');
    expect(compareMeans([1, 3, 5], [2, 3, 4]).evidence).toBe('unclear');
    expect(compareMeans([1, 2], [4, 5, 6]).evidence).toBe('tooFew');
  });

  it("gives a rate Wilson's interval, inside 0–1 even at 0%", () => {
    const r = rate(2, 5);
    close(r.interval?.low, 0.1176);
    close(r.interval?.high, 0.7693);
    expect(rate(0, 4).interval?.low).toBe(0);
    expect(rate(0, 0).interval).toBeNull();
  });

  it("compares two rates with Newcombe's interval", () => {
    expect(compareRates(rate(9, 10), rate(1, 10)).evidence).toBe('clear');
    expect(compareRates(rate(3, 5), rate(2, 5)).evidence).toBe('unclear');
  });

  it("measures rank correlation with Spearman's ρ", () => {
    const c = correlation([2, 1, 4, 3, 6, 5].map((y, i) => ({ x: i + 1, y })));
    close(c.rho?.estimate, 1 - (6 * 6) / (6 * 35));
    expect(c.evidence).toBe('clear'); // 0.83 over six days just clears zero
    const weak = correlation([3, 1, 5, 2, 6, 4].map((y, i) => ({ x: i + 1, y })));
    close(weak.rho?.estimate, 1 - (6 * 18) / (6 * 35));
    expect(weak.evidence).toBe('unclear');
    const strong = correlation(Array.from({ length: 12 }, (_, i) => ({ x: i, y: 20 - i })));
    close(strong.rho?.estimate, -1);
    expect(strong.evidence).toBe('clear');
    expect(
      correlation([
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 1, y: 3 },
      ]).rho,
    ).toBeNull();
  });
});
