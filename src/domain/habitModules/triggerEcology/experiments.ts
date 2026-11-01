import { dosesByDay } from '@domain/habits/insights';
import { addDays, isValidDate } from '@domain/shared/dates';
import { average } from '@domain/shared/math';

import type { ModuleInput } from '@domain/habitModules/modules';

import { type TriggerKey, isTriggerKey, shortNights, triggersOf } from './triggers';

/**
 * A behavioural experiment: "when this trigger comes, I'll try something else", run
 * for a set number of days and compared with the same number of days just before.
 * It reads the same urges and doses as everything else; nothing extra is logged.
 */
export type Experiment = {
  habitId: string;
  trigger: TriggerKey;
  /** What you'll try instead, in your words; may be empty. */
  plan: string;
  /** Local date the experiment began. */
  startedOn: string;
  days: number;
};

export const EXPERIMENT_LENGTHS = [7, 14] as const;
export const PLAN_MAX_LENGTH = 120;
/** Finished experiments kept per habit, newest first. */
const KEPT_PER_HABIT = 5;

export type TriggerEcologyState = { experiments: Experiment[] };
export const EMPTY_STATE: TriggerEcologyState = { experiments: [] };

/** Stored state; anything that isn't a valid experiment is dropped. */
export function parseTriggerEcologyState(value: unknown): TriggerEcologyState {
  const list = (value as { experiments?: unknown } | null)?.experiments;
  if (!Array.isArray(list)) return EMPTY_STATE;
  const experiments = list.filter(
    (x): x is Experiment =>
      typeof x?.habitId === 'string' &&
      x.habitId !== '' &&
      isTriggerKey(x.trigger) &&
      typeof x.plan === 'string' &&
      isValidDate(x.startedOn) &&
      (EXPERIMENT_LENGTHS as readonly number[]).includes(x.days),
  );
  return { experiments: experiments.map((x) => ({ ...x, plan: x.plan.slice(0, PLAN_MAX_LENGTH) })) };
}

const lastDay = (x: Experiment) => addDays(x.startedOn, x.days - 1);

/** The habit's latest experiment, running or finished, or null. */
export const latestExperiment = (state: TriggerEcologyState, habitId: string): Experiment | null =>
  state.experiments
    .filter((x) => x.habitId === habitId)
    .sort((a, b) => (a.startedOn < b.startedOn ? 1 : -1))[0] ?? null;

/** Starts an experiment, replacing one already running for the habit. */
export function startExperiment(state: TriggerEcologyState, experiment: Experiment): TriggerEcologyState {
  const others = state.experiments.filter((x) => x.habitId !== experiment.habitId);
  const mine = state.experiments
    .filter((x) => x.habitId === experiment.habitId && lastDay(x) < experiment.startedOn)
    .sort((a, b) => (a.startedOn < b.startedOn ? 1 : -1))
    .slice(0, KEPT_PER_HABIT - 1);
  const clean = { ...experiment, plan: experiment.plan.trim().slice(0, PLAN_MAX_LENGTH) };
  return { experiments: [...others, clean, ...mine] };
}

/** Removes an experiment, e.g. to start over or put it away. */
export const removeExperiment = (
  state: TriggerEcologyState,
  experiment: Experiment,
): TriggerEcologyState => ({
  experiments: state.experiments.filter(
    (x) => !(x.habitId === experiment.habitId && x.startedOn === experiment.startedOn),
  ),
});

export type PeriodResult = {
  from: string;
  to: string;
  /** Days the habit was logged. */
  loggedDays: number;
  dosesPerDay: number | null;
  /** Urges that came with the trigger, and how many of them passed. */
  triggerUrges: number;
  triggerPassed: number;
};

export type ExperimentResult = {
  /** Day of the experiment today, 1-based, capped at its length. */
  day: number;
  finished: boolean;
  before: PeriodResult;
  during: PeriodResult;
};

/** The experiment so far against the same number of days just before it. */
export function experimentResult(
  x: Experiment,
  { habit, entries, urges, today }: ModuleInput,
): ExperimentResult {
  const end = lastDay(x) < today ? lastDay(x) : today;
  const short = shortNights(entries);
  const byDay = [...dosesByDay(entries, habit.id)];
  const period = (from: string, to: string): PeriodResult => {
    const days = byDay.filter(([d]) => d >= from && d <= to);
    const withTrigger = urges.filter(
      (u) =>
        u.habitId === habit.id && u.date >= from && u.date <= to && triggersOf(u, short).includes(x.trigger),
    );
    return {
      from,
      to,
      loggedDays: days.length,
      dosesPerDay: average(days.map(([, n]) => n)),
      triggerUrges: withTrigger.length,
      triggerPassed: withTrigger.filter((u) => u.outcome === 'passed').length,
    };
  };
  const elapsed = Math.round(
    (Date.parse(`${end}T12:00:00`) - Date.parse(`${x.startedOn}T12:00:00`)) / 86_400_000,
  );
  return {
    day: Math.min(x.days, Math.max(1, elapsed + 1)),
    finished: today > lastDay(x),
    before: period(addDays(x.startedOn, -x.days), addDays(x.startedOn, -1)),
    during: period(x.startedOn, end),
  };
}
