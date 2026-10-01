import { stepCounter } from '../modules/step-counter';
import { loadStepCheckpoint, saveStepCheckpoint } from './storage';
import { Entry } from './types';
import { CountPreview, WindowedCounter, previewCount, withCount } from './windowedCount';

/** Google Play services keeps recorded steps for 10 days; leave a day of margin. */
const MAX_WINDOW_MS = 9 * 24 * 60 * 60 * 1000;

const stepCount: WindowedCounter = {
  countKey: 'steps',
  fromKey: 'stepsFrom',
  maxWindowMs: MAX_WINDOW_MS,
  loadCheckpoint: () => loadStepCheckpoint(),
  saveCheckpoint: (at) => saveStepCheckpoint(at),
  count: (start, end) => stepCounter.countSteps(start, end),
};

/**
 * Turns on background step recording and starts counting from now. Returns false
 * if Google Play services refused to record.
 */
export async function startStepRecording(now: Date = new Date()): Promise<boolean> {
  if (!(await stepCounter.subscribe())) return false;
  await saveStepCheckpoint(now);
  return true;
}

export type StepPreview = CountPreview;

/** Steps so far in the current window, i.e. what the next live check-in would record. */
export const previewSteps = (now: Date = new Date()) => previewCount(stepCount, now);

/** Adds the step count to an entry being saved; see `withCount`. */
export const withSteps = (
  entry: Entry,
  existing: Entry | undefined,
  trackSteps: boolean,
  now: Date = new Date(),
) => withCount(stepCount, entry, existing, trackSteps, now);

/** 12,480 */
export const formatSteps = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** 980 · 12.5k, for tight spaces. */
export const formatStepsShort = (n: number) =>
  n < 1000 ? String(Math.round(n)) : `${(n / 1000).toFixed(1)}k`;
