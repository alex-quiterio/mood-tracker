import { unlockStats } from '../modules/unlock-stats';
import { localDate, weekdayShort } from './dates';
import { loadUnlockCheckpoint, saveUnlockCheckpoint } from './storage';
import { Entry } from './types';
import { CountPreview, WindowedCounter, previewCount, windowStart, withCount } from './windowedCount';

export { isLiveCheckIn } from './windowedCount';

/** Android keeps usage events for roughly a week; older windows would undercount. */
const MAX_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const unlockCounter: WindowedCounter = {
  countKey: 'unlocks',
  fromKey: 'unlocksFrom',
  maxWindowMs: MAX_WINDOW_MS,
  loadCheckpoint: () => loadUnlockCheckpoint(),
  saveCheckpoint: (at) => saveUnlockCheckpoint(at),
  count: (start, end) => unlockStats.countUnlocks(start, end),
};

export const unlockWindowStart = (checkpoint: Date | null, now: Date) =>
  windowStart(checkpoint, now, MAX_WINDOW_MS);

/** "21:00" when `from` is on `day`, otherwise "Tue 21:00". */
export function formatSince(from: Date, day: string): string {
  const time = `${String(from.getHours()).padStart(2, '0')}:${String(from.getMinutes()).padStart(2, '0')}`;
  const fromDate = localDate(from);
  return fromDate === day ? time : `${weekdayShort(fromDate)} ${time}`;
}

export function formatUnlocksSince(entry: Pick<Entry, 'date' | 'unlocksFrom'>): string {
  return entry.unlocksFrom ? formatSince(new Date(entry.unlocksFrom), entry.date) : '';
}

export type UnlockPreview = CountPreview;

/** Unlocks so far in the current window, i.e. what the next live check-in would record. */
export const previewUnlocks = (now: Date = new Date()) => previewCount(unlockCounter, now);

/** Adds the unlock count to an entry being saved; see `withCount`. */
export const withUnlocks = (
  entry: Entry,
  existing: Entry | undefined,
  trackUnlocks: boolean,
  now: Date = new Date(),
) => withCount(unlockCounter, entry, existing, trackUnlocks, now);
