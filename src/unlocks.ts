import { unlockStats } from '../modules/unlock-stats';
import { localDate, slotForTime, weekdayShort } from './dates';
import { loadUnlockCheckpoint, saveUnlockCheckpoint } from './storage';
import { Entry, Slot } from './types';

/** Android keeps usage events for roughly a week; older windows would undercount. */
const MAX_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** A live check-in is today's entry for the slot matching the current time. Only those get unlock counts. */
export function isLiveCheckIn(date: string, slot: Slot, now: Date): boolean {
  return date === localDate(now) && slot === slotForTime(now);
}

/**
 * Where the unlock window starts: the last checkpoint, or the start of today when
 * there is none. Null when the checkpoint is too old for the event log to cover.
 */
export function unlockWindowStart(checkpoint: Date | null, now: Date): Date | null {
  if (!checkpoint) return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (now.getTime() - checkpoint.getTime() > MAX_WINDOW_MS) return null;
  return checkpoint;
}

/** "21:00" when the window started on the entry's day, otherwise "Tue 21:00". */
export function formatUnlocksSince(entry: Pick<Entry, 'date' | 'unlocksFrom'>): string {
  if (!entry.unlocksFrom) return '';
  const from = new Date(entry.unlocksFrom);
  const time = `${String(from.getHours()).padStart(2, '0')}:${String(from.getMinutes()).padStart(2, '0')}`;
  const fromDate = localDate(from);
  return fromDate === entry.date ? time : `${weekdayShort(fromDate)} ${time}`;
}

/**
 * Adds the unlock count to an entry being saved. Edits keep the count from the
 * first save (even with tracking off), so re-saving never shrinks its window.
 * Never throws: a failed count just leaves the entry without one.
 */
export async function withUnlocks(
  entry: Entry,
  existing: Entry | undefined,
  trackUnlocks: boolean,
  now: Date = new Date(),
): Promise<Entry> {
  if (existing?.unlocks !== undefined) {
    return { ...entry, unlocks: existing.unlocks, unlocksFrom: existing.unlocksFrom };
  }
  if (!trackUnlocks || !isLiveCheckIn(entry.date, entry.slot, now)) return entry;
  try {
    const start = unlockWindowStart(await loadUnlockCheckpoint(), now);
    if (!start) {
      // Too long since the last count to trust the log; start fresh from now.
      await saveUnlockCheckpoint(now);
      return entry;
    }
    const count = await unlockStats.countUnlocks(start, now);
    // No usage access: keep the checkpoint so the count resumes once access is back.
    if (count === null) return entry;
    await saveUnlockCheckpoint(now);
    return { ...entry, unlocks: count, unlocksFrom: start.toISOString() };
  } catch {
    return entry;
  }
}
