import { unlockStats } from '@modules/unlock-stats';
import { loadUnlockCheckpoint, saveUnlockCheckpoint } from '@infrastructure/storage/checkpoints';
import { Entry } from '@domain/checkins/types';
import {
  CountPreview,
  WindowedCounter,
  previewCount,
  windowStart,
  withCount,
} from '@domain/signals/windowedCount';

export { isLiveCheckIn } from '@domain/signals/windowedCount';

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

/** Unlocks so far in the current window, i.e. what the next live check-in would record. */
export const previewUnlocks = (now: Date = new Date()) => previewCount(unlockCounter, now);

/** Adds the unlock count to an entry being saved; see `withCount`. */
export const withUnlocks = (
  entry: Entry,
  existing: Entry | undefined,
  trackUnlocks: boolean,
  now: Date = new Date(),
) => withCount(unlockCounter, entry, existing, trackUnlocks, now);
