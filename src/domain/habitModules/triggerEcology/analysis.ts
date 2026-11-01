import { SLOTS, type Entry, type Slot } from '@domain/checkins/types';
import { dosesByDay } from '@domain/habits/insights';
import type { Urge } from '@domain/habits/urges';
import { addDays, lastNDays, parseLocalDate, slotForTime } from '@domain/shared/dates';
import { average } from '@domain/shared/math';
import {
  type Comparison,
  type Correlation,
  type Rate,
  type RateComparison,
  compareMeans,
  compareRates,
  correlation,
  rate,
} from '@domain/shared/statistics';

import type { ModuleInput } from '@domain/habitModules/modules';

import {
  TRIGGER_GROUPS,
  type TriggerGroup,
  type TriggerKey,
  groupOf,
  shortNights,
  triggersOf,
} from './triggers';

/** How far back the analysis looks: eight weeks, enough for weekdays to repeat. */
export const ANALYSIS_DAYS = 56;
/** Triggers listed per group, and combinations shown. */
const TOP_TRIGGERS = 4;
const TOP_COMBINATIONS = 3;
/** A combination needs to come back to be a pattern. */
const MIN_COMBINATION = 2;

/**
 * A trigger and how its urges went: the share let pass (with its interval), and that
 * share against urges without the trigger, so a hard trigger shows as a lower rate.
 */
export type TriggerStat = { key: TriggerKey; passed: Rate; versusOthers: RateComparison };
export type Combination = { a: TriggerKey; b: TriggerKey; passed: Rate };

export type DayPoint = { date: string; doses: number | null; urges: number; passed: number };

export type TriggerEcologyReport = {
  from: string;
  to: string;
  /** Every day of the window, oldest first: doses (null when not logged) and urges. */
  daily: DayPoint[];
  /** Urges let pass out of all urges for this habit: the line each trigger is read against. */
  overall: Rate;
  /** Per group, the triggers that came with the most urges first. Empty when none were named. */
  triggers: Record<TriggerGroup, TriggerStat[]>;
  /** Pairs of triggers that came together in one urge, most frequent first. */
  combinations: Combination[];
  /** Doses per logged day: days with an urge (a) against days without (b). */
  urgeDays: Comparison;
  /**
   * Conscious vs automatic: doses that came after a pause in the urge flow, against
   * doses logged at check-in with no pause before them, beside urges that passed.
   */
  pauses: { afterPause: number; noPause: number; passed: number } | null;
  /** When doses happen. */
  rhythm: {
    /** Average doses per check-in, by weekday (Monday first) and part of the day, with how many check-ins each. */
    grid: { mean: number | null; n: number }[][];
    byWeekday: (number | null)[];
    bySlot: Record<Slot, number | null>;
    urgesBySlot: Record<Slot, number>;
    busiestWeekday: number | null;
    busiestSlot: Slot | null;
  } | null;
  /** What follows: check-ins with some (a) against none (b). */
  after: {
    mood: Comparison;
    /** The next check-in, the same day or the next. */
    nextMood: Comparison;
    /** Hours slept the night after. */
    sleep: Comparison;
  } | null;
  /** How doses on a day move with the signals around it (Spearman's ρ). */
  links: {
    /** Hours slept the night before (x) against that day's doses (y). */
    sleep: Correlation;
    /** That day's steps. */
    steps: Correlation;
    /** That day's average mood. */
    mood: Correlation;
  };
};

/** Monday 0 … Sunday 6. */
export const weekdayIndex = (date: string) => (parseLocalDate(date).getDay() + 6) % 7;

const order = (e: Entry) => `${e.date}|${SLOTS.indexOf(e.slot)}`;

/** The key with the largest value, or null when there's none above zero. */
function busiest<T>(keys: readonly T[], value: (k: T) => number | null): T | null {
  let best: T | null = null;
  let top = 0;
  for (const k of keys) {
    const v = value(k) ?? 0;
    if (v > top) [best, top] = [k, v];
  }
  return best;
}

const passedOf = (list: Urge[]) => list.filter((u) => u.outcome === 'passed').length;

/**
 * The trigger ecology of one habit over the last ANALYSIS_DAYS: what comes with its
 * urges and how they go, when doses happen, what follows them and what moves with
 * them. Every rate and comparison carries its interval and sample size, and every
 * part degrades on its own when data is missing.
 */
export function triggerEcology({ habit, entries, urges, today }: ModuleInput): TriggerEcologyReport {
  const from = addDays(today, -(ANALYSIS_DAYS - 1));
  const inWindow = (date: string) => date >= from && date <= today;
  const window = entries.filter((e) => inWindow(e.date)).sort((a, b) => (order(a) < order(b) ? -1 : 1));
  const own = urges.filter((u) => u.habitId === habit.id && inWindow(u.date));
  const short = shortNights(entries);

  // Triggers, each urge counted once per trigger, each read against the urges without it.
  const keysOf = new Map(own.map((u) => [u, triggersOf(u, short)]));
  const byTrigger = new Map<TriggerKey, Urge[]>();
  const pairs = new Map<string, Urge[]>();
  for (const [u, keys] of keysOf) {
    for (const k of keys) byTrigger.set(k, [...(byTrigger.get(k) ?? []), u]);
    for (let i = 0; i < keys.length; i++)
      for (let j = i + 1; j < keys.length; j++) {
        const pair = [keys[i], keys[j]].sort().join('+');
        pairs.set(pair, [...(pairs.get(pair) ?? []), u]);
      }
  }
  const stats: TriggerStat[] = [...byTrigger]
    .map(([key, list]) => {
      const others = own.filter((u) => !keysOf.get(u)!.includes(key));
      const passed = rate(passedOf(list), list.length);
      return { key, passed, versusOthers: compareRates(passed, rate(passedOf(others), others.length)) };
    })
    .sort((a, b) => b.passed.n - a.passed.n);
  const triggers = Object.fromEntries(
    TRIGGER_GROUPS.map((g) => [g, stats.filter((s) => groupOf(s.key) === g).slice(0, TOP_TRIGGERS)]),
  ) as Record<TriggerGroup, TriggerStat[]>;

  const combinations: Combination[] = [...pairs]
    .filter(([, list]) => list.length >= MIN_COMBINATION)
    .map(([pair, list]) => {
      const [a, b] = pair.split('+') as [TriggerKey, TriggerKey];
      return { a, b, passed: rate(passedOf(list), list.length) };
    })
    .sort((x, y) => y.passed.n - x.passed.n)
    .slice(0, TOP_COMBINATIONS);

  // Doses by day and by check-in, only where the habit was logged.
  const days = [...dosesByDay(window, habit.id)];
  const dosesOn = new Map(days);
  const logged = window.filter((e) => e.habits?.doses[habit.id] !== undefined);
  const doseOf = (e: Entry) => e.habits!.doses[habit.id].count;

  const urgeDates = new Set(own.map((u) => u.date));
  const urgeDays = compareMeans(
    days.filter(([d]) => urgeDates.has(d)).map(([, n]) => n),
    days.filter(([d]) => !urgeDates.has(d)).map(([, n]) => n),
  );

  // Doses covered by an urge that took the best of you in that part of the day came after a pause.
  let afterPause = 0;
  let noPause = 0;
  for (const e of logged) {
    const paused = own.filter(
      (u) => u.outcome === 'gaveIn' && u.date === e.date && slotForTime(new Date(u.recordedAt)) === e.slot,
    ).length;
    afterPause += Math.min(doseOf(e), paused);
    noPause += Math.max(0, doseOf(e) - paused);
  }
  const passedTotal = passedOf(own);
  const pauses = afterPause + noPause + passedTotal > 0 ? { afterPause, noPause, passed: passedTotal } : null;

  const grid = Array.from({ length: 7 }, (_, w) =>
    SLOTS.map((s) => {
      const cell = logged.filter((e) => e.slot === s && weekdayIndex(e.date) === w).map(doseOf);
      return { mean: average(cell), n: cell.length };
    }),
  );
  const byWeekday = Array.from({ length: 7 }, (_, i) =>
    average(days.filter(([d]) => weekdayIndex(d) === i).map(([, n]) => n)),
  );
  const bySlot = Object.fromEntries(
    SLOTS.map((s) => [s, average(logged.filter((e) => e.slot === s).map(doseOf))]),
  ) as Record<Slot, number | null>;
  const urgesBySlot = Object.fromEntries(
    SLOTS.map((s) => [s, own.filter((u) => slotForTime(new Date(u.recordedAt)) === s).length]),
  ) as Record<Slot, number>;
  const rhythm =
    days.length > 0 || own.length > 0
      ? {
          grid,
          byWeekday,
          bySlot,
          urgesBySlot,
          busiestWeekday: busiest([0, 1, 2, 3, 4, 5, 6], (i) => byWeekday[i]),
          busiestSlot: busiest(SLOTS, (s) => bySlot[s]),
        }
      : null;

  // What follows: the next check-in's mood, and the next night's sleep.
  const moodWith = { some: [] as number[], none: [] as number[] };
  const nextMood = { some: [] as number[], none: [] as number[] };
  window.forEach((e, i) => {
    if (e.habits?.doses[habit.id] === undefined) return;
    const side = doseOf(e) > 0 ? 'some' : 'none';
    moodWith[side].push(e.mood);
    const next = window[i + 1];
    if (next && (next.date === e.date || next.date === addDays(e.date, 1))) nextMood[side].push(next.mood);
  });
  const sleepOn = new Map(
    entries.filter((e) => e.sleep?.hours !== undefined).map((e) => [e.date, e.sleep!.hours!]),
  );
  const sleepAfter = (match: (n: number) => boolean) =>
    days.filter(([d, n]) => match(n) && sleepOn.has(addDays(d, 1))).map(([d]) => sleepOn.get(addDays(d, 1))!);
  const after =
    logged.length > 0
      ? {
          mood: compareMeans(moodWith.some, moodWith.none),
          nextMood: compareMeans(nextMood.some, nextMood.none),
          sleep: compareMeans(
            sleepAfter((n) => n > 0),
            sleepAfter((n) => n === 0),
          ),
        }
      : null;

  // What moves with doses, day by day.
  const stepsOn = new Map<string, number>();
  const moodsOn = new Map<string, number[]>();
  for (const e of window) {
    if (e.steps !== undefined) stepsOn.set(e.date, (stepsOn.get(e.date) ?? 0) + e.steps);
    moodsOn.set(e.date, [...(moodsOn.get(e.date) ?? []), e.mood]);
  }
  const against = (signal: (date: string) => number | undefined) =>
    correlation(
      days.flatMap(([d, n]) => {
        const x = signal(d);
        return x === undefined ? [] : [{ x, y: n }];
      }),
    );
  const links = {
    sleep: against((d) => sleepOn.get(d)),
    steps: against((d) => stepsOn.get(d)),
    mood: against((d) => (moodsOn.has(d) ? average(moodsOn.get(d)!)! : undefined)),
  };

  const daily: DayPoint[] = lastNDays(ANALYSIS_DAYS, today).map((date) => {
    const that = own.filter((u) => u.date === date);
    return { date, doses: dosesOn.get(date) ?? null, urges: that.length, passed: passedOf(that) };
  });

  return {
    from,
    to: today,
    daily,
    overall: rate(passedTotal, own.length),
    triggers,
    combinations,
    urgeDays,
    pauses,
    rhythm,
    after,
    links,
  };
}

/**
 * What the report clearly shows, as facts for the overview: only comparisons whose
 * interval rules out no difference, largest effects first. Never a verdict on the
 * person: the words say what went with what.
 */
export type Finding =
  /** Urges with this trigger passed more or less often than the rest (`difference` in rate, −1…1). */
  | { kind: 'trigger'; key: TriggerKey; difference: number }
  /** Days with an urge carried this many more (or fewer) doses than days without. */
  | { kind: 'urgeDays'; difference: number }
  /** With doses, this was higher or lower than with none (moods on 1–5, sleep in hours). */
  | { kind: 'after'; which: 'mood' | 'nextMood' | 'sleep'; difference: number }
  /** Doses went up (ρ > 0) or down (ρ < 0) with this signal. */
  | { kind: 'link'; which: 'sleep' | 'steps' | 'mood'; rho: number };

/** How much a finding moves, on a rough common scale, to put the biggest first. */
const strength = (f: Finding): number => {
  switch (f.kind) {
    case 'trigger':
      return Math.abs(f.difference);
    case 'urgeDays':
      return Math.min(1, Math.abs(f.difference) / 3);
    case 'after':
      return Math.min(1, Math.abs(f.difference) / (f.which === 'sleep' ? 2 : 1.5));
    case 'link':
      return Math.abs(f.rho);
  }
};

export function keyFindings(report: TriggerEcologyReport, limit = 4): Finding[] {
  const found: Finding[] = [];
  for (const g of TRIGGER_GROUPS)
    for (const s of report.triggers[g])
      if (s.versusOthers.evidence === 'clear' && s.versusOthers.difference)
        found.push({ kind: 'trigger', key: s.key, difference: s.versusOthers.difference.estimate });
  if (report.urgeDays.evidence === 'clear' && report.urgeDays.difference)
    found.push({ kind: 'urgeDays', difference: report.urgeDays.difference.estimate });
  if (report.after)
    for (const which of ['mood', 'nextMood', 'sleep'] as const) {
      const c = report.after[which];
      if (c.evidence === 'clear' && c.difference)
        found.push({ kind: 'after', which, difference: c.difference.estimate });
    }
  for (const which of ['sleep', 'steps', 'mood'] as const) {
    const c = report.links[which];
    if (c.evidence === 'clear' && c.rho) found.push({ kind: 'link', which, rho: c.rho.estimate });
  }
  return found.sort((a, b) => strength(b) - strength(a)).slice(0, limit);
}
