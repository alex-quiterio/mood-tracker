import { SLOTS, type Entry, type Slot } from '@domain/checkins/types';
import { dosesByDay } from '@domain/habits/insights';
import type { Urge } from '@domain/habits/urges';
import { addDays, parseLocalDate, slotForTime } from '@domain/shared/dates';
import { average } from '@domain/shared/math';

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

export type TriggerStat = { key: TriggerKey; urges: number; passed: number };
export type Combination = { a: TriggerKey; b: TriggerKey; urges: number; passed: number };

export type TriggerEcologyReport = {
  from: string;
  to: string;
  /** Per group, the triggers that came with the most urges first. Empty when none were named. */
  triggers: Record<TriggerGroup, TriggerStat[]>;
  /** Urges against doses: did days with a logged urge carry more doses? */
  urgesAndDoses: {
    urges: number;
    passed: number;
    /** Average doses on logged days with an urge, and on logged days without one. */
    onUrgeDays: number | null;
    onOtherDays: number | null;
  } | null;
  /**
   * Conscious vs automatic: doses that came after a pause in the urge flow, against
   * doses logged at check-in with no pause before them, beside urges that passed.
   */
  pauses: { afterPause: number; noPause: number; passed: number } | null;
  /** Average doses per logged day by weekday (Monday first) and per check-in by part of the day. */
  rhythm: {
    byWeekday: (number | null)[];
    bySlot: Record<Slot, number | null>;
    urgesBySlot: Record<Slot, number>;
    busiestWeekday: number | null;
    busiestSlot: Slot | null;
  } | null;
  /** Pairs of triggers that came together in one urge, most frequent first. */
  combinations: Combination[];
  /** Mood and sleep around check-ins with doses and with none. */
  beforeAfter: {
    moodWithSome: number | null;
    moodWithNone: number | null;
    /** The mood of the next check-in (same day or the next). */
    nextMoodAfterSome: number | null;
    nextMoodAfterNone: number | null;
    /** Hours slept the night after a day with doses, or a day with none. */
    sleepAfterSome: number | null;
    sleepAfterNone: number | null;
  } | null;
};

/** Monday 0 … Sunday 6. */
export const weekdayIndex = (date: string) => (parseLocalDate(date).getDay() + 6) % 7;

const order = (e: Entry) => `${e.date}|${SLOTS.indexOf(e.slot)}`;

/** Index of the largest value, or null when there's none above zero. */
function busiest<T>(keys: readonly T[], value: (k: T) => number | null): T | null {
  let best: T | null = null;
  let top = 0;
  for (const k of keys) {
    const v = value(k) ?? 0;
    if (v > top) [best, top] = [k, v];
  }
  return best;
}

/**
 * The trigger ecology of one habit over the last ANALYSIS_DAYS: what comes with its
 * urges, how urges and doses relate, when they happen, and what follows. Every part
 * degrades on its own: missing sleep, steps or urges leave that part empty.
 */
export function triggerEcology({ habit, entries, urges, today }: ModuleInput): TriggerEcologyReport {
  const from = addDays(today, -(ANALYSIS_DAYS - 1));
  const inWindow = (date: string) => date >= from && date <= today;
  const window = entries.filter((e) => inWindow(e.date)).sort((a, b) => (order(a) < order(b) ? -1 : 1));
  const own = urges.filter((u) => u.habitId === habit.id && inWindow(u.date));
  const short = shortNights(entries);
  const passed = (list: Urge[]) => list.filter((u) => u.outcome === 'passed').length;

  // Triggers, each urge counted once per trigger.
  const byTrigger = new Map<TriggerKey, Urge[]>();
  const pairs = new Map<string, Urge[]>();
  for (const u of own) {
    const keys = triggersOf(u, short);
    for (const k of keys) byTrigger.set(k, [...(byTrigger.get(k) ?? []), u]);
    for (let i = 0; i < keys.length; i++)
      for (let j = i + 1; j < keys.length; j++) {
        const pair = [keys[i], keys[j]].sort().join('+');
        pairs.set(pair, [...(pairs.get(pair) ?? []), u]);
      }
  }
  const stats: TriggerStat[] = [...byTrigger]
    .map(([key, list]) => ({ key, urges: list.length, passed: passed(list) }))
    .sort((a, b) => b.urges - a.urges);
  const triggers = Object.fromEntries(
    TRIGGER_GROUPS.map((g) => [g, stats.filter((s) => groupOf(s.key) === g).slice(0, TOP_TRIGGERS)]),
  ) as Record<TriggerGroup, TriggerStat[]>;

  const combinations: Combination[] = [...pairs]
    .filter(([, list]) => list.length >= MIN_COMBINATION)
    .map(([pair, list]) => {
      const [a, b] = pair.split('+') as [TriggerKey, TriggerKey];
      return { a, b, urges: list.length, passed: passed(list) };
    })
    .sort((x, y) => y.urges - x.urges)
    .slice(0, TOP_COMBINATIONS);

  // Doses by day and by check-in, only where the habit was logged.
  const days = [...dosesByDay(window, habit.id)];
  const logged = window.filter((e) => e.habits?.doses[habit.id] !== undefined);
  const doseOf = (e: Entry) => e.habits!.doses[habit.id].count;

  const urgeDays = new Set(own.map((u) => u.date));
  const urgesAndDoses =
    own.length > 0 || days.length > 0
      ? {
          urges: own.length,
          passed: passed(own),
          onUrgeDays: average(days.filter(([d]) => urgeDays.has(d)).map(([, n]) => n)),
          onOtherDays: average(days.filter(([d]) => !urgeDays.has(d)).map(([, n]) => n)),
        }
      : null;

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
  const pauses = afterPause + noPause + passed(own) > 0 ? { afterPause, noPause, passed: passed(own) } : null;

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
          byWeekday,
          bySlot,
          urgesBySlot,
          busiestWeekday: busiest([0, 1, 2, 3, 4, 5, 6], (i) => byWeekday[i]),
          busiestSlot: busiest(SLOTS, (s) => bySlot[s]),
        }
      : null;

  // What follows: the next check-in's mood, and the next night's sleep.
  const some: Entry[] = [];
  const none: Entry[] = [];
  const nextAfter = { some: [] as number[], none: [] as number[] };
  window.forEach((e, i) => {
    if (e.habits?.doses[habit.id] === undefined) return;
    const side = doseOf(e) > 0 ? 'some' : 'none';
    (side === 'some' ? some : none).push(e);
    const next = window[i + 1];
    if (next && (next.date === e.date || next.date === addDays(e.date, 1))) nextAfter[side].push(next.mood);
  });
  const sleepOn = new Map(
    window.filter((e) => e.sleep?.hours !== undefined).map((e) => [e.date, e.sleep!.hours!]),
  );
  const sleepAfter = (match: (n: number) => boolean) =>
    average(
      days
        .filter(([d, n]) => match(n) && sleepOn.has(addDays(d, 1)))
        .map(([d]) => sleepOn.get(addDays(d, 1))!),
    );
  const beforeAfter =
    logged.length > 0
      ? {
          moodWithSome: average(some.map((e) => e.mood)),
          moodWithNone: average(none.map((e) => e.mood)),
          nextMoodAfterSome: average(nextAfter.some),
          nextMoodAfterNone: average(nextAfter.none),
          sleepAfterSome: sleepAfter((n) => n > 0),
          sleepAfterNone: sleepAfter((n) => n === 0),
        }
      : null;

  return { from, to: today, triggers, urgesAndDoses, pauses, rhythm, combinations, beforeAfter };
}
