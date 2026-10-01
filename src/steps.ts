import { StepReading, stepCounter } from '../modules/step-counter';
import { StepCheckpoint, loadStepCheckpoint, saveStepCheckpoint } from './storage';
import { Entry } from './types';
import { isLiveCheckIn } from './unlocks';

/** Boot time is derived from two clocks, so it wobbles slightly between readings. */
const REBOOT_TOLERANCE_MS = 60_000;

export const checkpointFrom = (reading: StepReading, at: Date): StepCheckpoint => ({
  steps: reading.steps,
  bootTime: reading.bootTime,
  at: at.toISOString(),
});

/**
 * Steps between a checkpoint and a new reading. The counter restarts at zero on
 * reboot; then the best we know is the steps since boot.
 */
export function stepsSince(checkpoint: StepCheckpoint, reading: StepReading): { steps: number; from: Date } {
  const rebooted =
    reading.steps < checkpoint.steps ||
    Math.abs(reading.bootTime - checkpoint.bootTime) > REBOOT_TOLERANCE_MS;
  if (rebooted) {
    return {
      steps: Math.round(reading.steps),
      from: new Date(Math.max(reading.bootTime, Date.parse(checkpoint.at))),
    };
  }
  return { steps: Math.round(reading.steps - checkpoint.steps), from: new Date(checkpoint.at) };
}

/** Starts counting from now, e.g. when tracking is turned on. */
export async function resetStepCheckpoint(now: Date = new Date()): Promise<void> {
  const reading = await stepCounter.read();
  if (reading) await saveStepCheckpoint(checkpointFrom(reading, now));
}

/**
 * Adds the step count to an entry being saved, like `withUnlocks`: edits keep the
 * first count, only live check-ins are counted, and it never throws.
 */
export async function withSteps(
  entry: Entry,
  existing: Entry | undefined,
  trackSteps: boolean,
  now: Date = new Date(),
): Promise<Entry> {
  if (existing?.steps !== undefined) {
    return { ...entry, steps: existing.steps, stepsFrom: existing.stepsFrom };
  }
  if (!trackSteps || !isLiveCheckIn(entry.date, entry.slot, now)) return entry;
  try {
    const reading = await stepCounter.read();
    // No reading (permission revoked, sensor silent): keep the checkpoint for next time.
    if (!reading) return entry;
    const checkpoint = await loadStepCheckpoint();
    await saveStepCheckpoint(checkpointFrom(reading, now));
    if (!checkpoint) return entry;
    const { steps, from } = stepsSince(checkpoint, reading);
    return { ...entry, steps, stepsFrom: from.toISOString() };
  } catch {
    return entry;
  }
}

export type StepPreview = { count: number; from: Date };

/** Steps so far in the current window, i.e. what the next live check-in would record. */
export async function previewSteps(): Promise<StepPreview | null> {
  try {
    const [reading, checkpoint] = await Promise.all([stepCounter.read(), loadStepCheckpoint()]);
    if (!reading || !checkpoint) return null;
    const { steps, from } = stepsSince(checkpoint, reading);
    return { count: steps, from };
  } catch {
    return null;
  }
}

/** 12,480 */
export const formatSteps = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** 980 · 12.5k, for tight spaces. */
export const formatStepsShort = (n: number) =>
  n < 1000 ? String(Math.round(n)) : `${(n / 1000).toFixed(1)}k`;
