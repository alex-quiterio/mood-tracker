import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { parseEntry } from '../domain/checkins/entries';
import { buildReflectionPrompt } from '../domain/voices/prompt';
import { weeklyStats } from '../domain/checkins/stats';
import { Entry } from '../domain/checkins/types';
import {
  isLiveCheckIn,
  previewUnlocks,
  unlockWindowStart,
  withUnlocks,
} from '../infrastructure/signals/unlocks';
import { formatUnlocksSince } from '../domain/signals/format';

const mockCountUnlocks = jest.fn<(start: Date, end: Date) => Promise<number | null>>();
jest.mock('../../modules/unlock-stats', () => ({
  unlockStats: { countUnlocks: (start: Date, end: Date) => mockCountUnlocks(start, end) },
}));

let mockCheckpoint: Date | null = null;
jest.mock('../infrastructure/storage/checkpoints', () => ({
  loadUnlockCheckpoint: async () => mockCheckpoint,
  saveUnlockCheckpoint: async (at: Date) => {
    mockCheckpoint = at;
  },
}));

// 2026-10-01 09:30 local: a morning check-in.
const now = new Date(2026, 9, 1, 9, 30);
const base: Entry = { date: '2026-10-01', slot: 'morning', mood: 3, recordedAt: now.toISOString() };

beforeEach(() => {
  mockCountUnlocks.mockReset();
  mockCheckpoint = null;
});

describe('unlock window', () => {
  it('only counts live check-ins', () => {
    expect(isLiveCheckIn('2026-10-01', 'morning', now)).toBe(true);
    expect(isLiveCheckIn('2026-10-01', 'evening', now)).toBe(false);
    expect(isLiveCheckIn('2026-09-30', 'morning', now)).toBe(false);
  });

  it('starts at the checkpoint, start of today without one, and gives up past 7 days', () => {
    const yesterday = new Date(2026, 8, 30, 21, 0);
    expect(unlockWindowStart(yesterday, now)).toEqual(yesterday);
    expect(unlockWindowStart(null, now)).toEqual(new Date(2026, 9, 1));
    expect(unlockWindowStart(new Date(2026, 8, 23, 9, 0), now)).toBeNull();
  });

  it('formats the window start', () => {
    expect(
      formatUnlocksSince({ date: '2026-10-01', unlocksFrom: new Date(2026, 9, 1, 8, 5).toISOString() }),
    ).toBe('08:05');
    expect(
      formatUnlocksSince({ date: '2026-10-01', unlocksFrom: new Date(2026, 8, 30, 21, 0).toISOString() }),
    ).toBe('Wed 21:00');
  });
});

describe('withUnlocks', () => {
  it('counts since the checkpoint and moves it to now', async () => {
    mockCheckpoint = new Date(2026, 8, 30, 21, 0);
    mockCountUnlocks.mockResolvedValue(17);
    const entry = await withUnlocks(base, undefined, true, now);
    expect(entry.unlocks).toBe(17);
    expect(entry.unlocksFrom).toBe(new Date(2026, 8, 30, 21, 0).toISOString());
    expect(mockCheckpoint).toEqual(now);
  });

  it('keeps the first count when an entry is edited, even with tracking off', async () => {
    const existing = { ...base, unlocks: 17, unlocksFrom: '2026-09-30T19:00:00.000Z' };
    const entry = await withUnlocks({ ...base, mood: 5 }, existing, false, now);
    expect(entry).toMatchObject({ mood: 5, unlocks: 17, unlocksFrom: '2026-09-30T19:00:00.000Z' });
    expect(mockCountUnlocks).not.toHaveBeenCalled();
  });

  it('skips counting when off, for back-filled entries, and without usage access', async () => {
    expect(await withUnlocks(base, undefined, false, now)).toEqual(base);
    const backfill = { ...base, date: '2026-09-30' };
    expect(await withUnlocks(backfill, undefined, true, now)).toEqual(backfill);

    mockCheckpoint = new Date(2026, 8, 30, 21, 0);
    mockCountUnlocks.mockResolvedValue(null);
    expect(await withUnlocks(base, undefined, true, now)).toEqual(base);
    expect(mockCheckpoint).toEqual(new Date(2026, 8, 30, 21, 0));
  });

  it('never throws when counting fails', async () => {
    mockCountUnlocks.mockRejectedValue(new Error('boom'));
    expect(await withUnlocks(base, undefined, true, now)).toEqual(base);
  });
});

describe('previewUnlocks', () => {
  it('counts the current window without moving the checkpoint', async () => {
    const checkpoint = new Date(2026, 9, 1, 7, 0);
    mockCheckpoint = checkpoint;
    mockCountUnlocks.mockResolvedValue(5);
    expect(await previewUnlocks(now)).toEqual({ count: 5, from: checkpoint });
    expect(mockCheckpoint).toBe(checkpoint);
  });

  it('is null without usage access', async () => {
    mockCountUnlocks.mockResolvedValue(null);
    expect(await previewUnlocks(now)).toBeNull();
  });
});

describe('unlocks in entries, stats and prompt', () => {
  it('parses unlock fields and rejects bad ones', () => {
    const raw = { ...base, unlocks: 4, unlocksFrom: '2026-10-01T06:00:00.000Z' };
    expect(parseEntry(raw)).toEqual(raw);
    expect(parseEntry({ ...base, unlocks: -1, unlocksFrom: raw.unlocksFrom })).toBeNull();
    expect(parseEntry({ ...base, unlocks: 4 })).toBeNull();
  });

  it('averages unlocks and mentions them in the prompt', () => {
    const entries: Entry[] = [
      { ...base, unlocks: 10, unlocksFrom: '2026-09-30T19:00:00.000Z' },
      { ...base, slot: 'afternoon', unlocks: 21, unlocksFrom: '2026-10-01T08:00:00.000Z' },
      { ...base, slot: 'evening' },
    ];
    const stats = weeklyStats(entries, '2026-10-01');
    expect(stats.unlockAverage).toBe(15.5);
    const prompt = buildReflectionPrompt(stats);
    expect(prompt).toContain('morning: 3/5, 10 phone unlocks since previous check-in');
    expect(prompt).toContain('evening: 3/5\n');
    expect(prompt).toContain('Average phone unlocks between check-ins: 16.');
    expect(prompt).toContain('how often I unlocked my phone');
  });

  it('leaves the prompt unchanged without unlock data', () => {
    const prompt = buildReflectionPrompt(weeklyStats([base], '2026-10-01'));
    expect(prompt).not.toContain('unlock');
  });
});
