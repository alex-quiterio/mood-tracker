import { localDate, slotForTime } from '../data/dates';
import { Entry, Slot } from '../data/types';

/**
 * Something the phone can count over a time window (unlocks, steps), saved on a
 * check-in as the count since the previous check-in. A checkpoint marks where the
 * next window starts.
 */
export type WindowedCounter = {
  countKey: 'unlocks' | 'steps';
  fromKey: 'unlocksFrom' | 'stepsFrom';
  /** How far back the phone keeps the data; older windows would undercount. */
  maxWindowMs: number;
  loadCheckpoint: () => Promise<Date | null>;
  saveCheckpoint: (at: Date) => Promise<void>;
  /** The count between two times, or null when it can't be read (no permission, unsupported). */
  count: (start: Date, end: Date) => Promise<number | null>;
};

export type CountPreview = { count: number; from: Date };

/** A live check-in is today's entry for the slot matching the current time. Only those get counts. */
export function isLiveCheckIn(date: string, slot: Slot, now: Date): boolean {
  return date === localDate(now) && slot === slotForTime(now);
}

/**
 * Where the window starts: the last checkpoint, or the start of today when there
 * is none. Null when the checkpoint is too old for the phone's data to cover.
 */
export function windowStart(checkpoint: Date | null, now: Date, maxWindowMs: number): Date | null {
  if (!checkpoint) return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (now.getTime() - checkpoint.getTime() > maxWindowMs) return null;
  return checkpoint;
}

/**
 * Adds the count to an entry being saved. Edits keep the count from the first
 * save (even with tracking off), so re-saving never shrinks its window. Never
 * throws: a failed count just leaves the entry without one.
 */
export async function withCount(
  counter: WindowedCounter,
  entry: Entry,
  existing: Entry | undefined,
  enabled: boolean,
  now: Date,
): Promise<Entry> {
  const { countKey, fromKey } = counter;
  if (existing?.[countKey] !== undefined) {
    return { ...entry, [countKey]: existing[countKey], [fromKey]: existing[fromKey] };
  }
  if (!enabled || !isLiveCheckIn(entry.date, entry.slot, now)) return entry;
  try {
    const start = windowStart(await counter.loadCheckpoint(), now, counter.maxWindowMs);
    if (!start) {
      // Too long since the last count to trust the data; start fresh from now.
      await counter.saveCheckpoint(now);
      return entry;
    }
    const count = await counter.count(start, now);
    // Unreadable (e.g. permission off): keep the checkpoint so counting resumes later.
    if (count === null) return entry;
    await counter.saveCheckpoint(now);
    return { ...entry, [countKey]: count, [fromKey]: start.toISOString() };
  } catch {
    return entry;
  }
}

/** The count so far in the current window, i.e. what the next live check-in would record. */
export async function previewCount(
  counter: WindowedCounter,
  now: Date = new Date(),
): Promise<CountPreview | null> {
  try {
    const from = windowStart(await counter.loadCheckpoint(), now, counter.maxWindowMs);
    if (!from) return null;
    const count = await counter.count(from, now);
    return count === null ? null : { count, from };
  } catch {
    return null;
  }
}
