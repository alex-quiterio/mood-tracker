import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { parseEntry } from '../entries';
import { buildReflectionPrompt } from '../prompt';
import { describeSignals } from '../signals';
import { weeklyStats } from '../stats';
import { formatSteps, formatStepsShort, previewSteps, startStepRecording, withSteps } from '../steps';
import { Entry } from '../types';
import { VOICES } from '../voices';

const mockCountSteps = jest.fn<(start: Date, end: Date) => Promise<number | null>>();
const mockSubscribe = jest.fn<() => Promise<boolean>>();
jest.mock('../../modules/step-counter', () => ({
  stepCounter: {
    countSteps: (start: Date, end: Date) => mockCountSteps(start, end),
    subscribe: () => mockSubscribe(),
  },
}));

let mockCheckpoint: Date | null = null;
jest.mock('../storage', () => ({
  loadStepCheckpoint: async () => mockCheckpoint,
  saveStepCheckpoint: async (at: Date) => {
    mockCheckpoint = at;
  },
}));

const now = new Date(2026, 9, 1, 9, 30); // Thu 1 Oct 09:30 local: a morning check-in
const lastCheckIn = new Date(2026, 8, 30, 21, 0); // Wed 21:00 local
const base: Entry = { date: '2026-10-01', slot: 'morning', mood: 4, recordedAt: now.toISOString() };

beforeEach(() => {
  mockCountSteps.mockReset();
  mockSubscribe.mockReset();
  mockCheckpoint = null;
});

describe('withSteps', () => {
  it('counts the steps between the checkpoint and now, then moves the checkpoint', async () => {
    mockCheckpoint = lastCheckIn;
    mockCountSteps.mockResolvedValue(2480);
    const entry = await withSteps(base, undefined, true, now);
    expect(entry).toMatchObject({ steps: 2480, stepsFrom: lastCheckIn.toISOString() });
    expect(mockCountSteps).toHaveBeenCalledWith(lastCheckIn, now);
    expect(mockCheckpoint).toEqual(now);
  });

  it('records a real zero', async () => {
    mockCheckpoint = lastCheckIn;
    mockCountSteps.mockResolvedValue(0);
    expect(await withSteps(base, undefined, true, now)).toMatchObject({ steps: 0 });
  });

  it('counts from the start of today without a checkpoint', async () => {
    mockCountSteps.mockResolvedValue(300);
    const entry = await withSteps(base, undefined, true, now);
    expect(mockCountSteps).toHaveBeenCalledWith(new Date(2026, 9, 1), now);
    expect(entry.stepsFrom).toBe(new Date(2026, 9, 1).toISOString());
  });

  it('starts fresh, without a count, when the checkpoint is older than the recorded data', async () => {
    mockCheckpoint = new Date(2026, 8, 20, 9, 0); // 11 days earlier
    const entry = await withSteps(base, undefined, true, now);
    expect(entry).not.toHaveProperty('steps');
    expect(mockCountSteps).not.toHaveBeenCalled();
    expect(mockCheckpoint).toEqual(now);
  });

  it('keeps the first count when an entry is edited, even with tracking off', async () => {
    const existing = { ...base, steps: 2480, stepsFrom: lastCheckIn.toISOString() };
    const entry = await withSteps({ ...base, mood: 2 }, existing, false, now);
    expect(entry).toMatchObject({ mood: 2, steps: 2480, stepsFrom: lastCheckIn.toISOString() });
    expect(mockCountSteps).not.toHaveBeenCalled();
  });

  it('skips counting when off and for back-filled or other-slot entries', async () => {
    mockCountSteps.mockResolvedValue(2480);
    expect(await withSteps(base, undefined, false, now)).toEqual(base);
    expect(await withSteps({ ...base, date: '2026-09-30' }, undefined, true, now)).not.toHaveProperty(
      'steps',
    );
    expect(await withSteps({ ...base, slot: 'evening' }, undefined, true, now)).not.toHaveProperty('steps');
    expect(mockCountSteps).not.toHaveBeenCalled();
  });

  it('keeps the checkpoint when steps cannot be read', async () => {
    mockCheckpoint = lastCheckIn;
    mockCountSteps.mockResolvedValue(null);
    expect(await withSteps(base, undefined, true, now)).toEqual(base);
    expect(mockCheckpoint).toEqual(lastCheckIn);
  });

  it('never throws', async () => {
    mockCheckpoint = lastCheckIn;
    mockCountSteps.mockRejectedValue(new Error('play services exploded'));
    expect(await withSteps(base, undefined, true, now)).toEqual(base);
  });
});

describe('previewSteps and startStepRecording', () => {
  it('previews the current window without moving the checkpoint', async () => {
    mockCheckpoint = lastCheckIn;
    mockCountSteps.mockResolvedValue(250);
    expect(await previewSteps(now)).toEqual({ count: 250, from: lastCheckIn });
    expect(mockCheckpoint).toEqual(lastCheckIn);
  });

  it('is null when steps cannot be read', async () => {
    mockCheckpoint = lastCheckIn;
    mockCountSteps.mockResolvedValue(null);
    expect(await previewSteps(now)).toBeNull();
  });

  it('subscribes and counts from now', async () => {
    mockCheckpoint = lastCheckIn;
    mockSubscribe.mockResolvedValue(true);
    expect(await startStepRecording(now)).toBe(true);
    expect(mockCheckpoint).toEqual(now);
  });

  it('leaves the checkpoint alone when recording does not start', async () => {
    mockCheckpoint = lastCheckIn;
    mockSubscribe.mockResolvedValue(false);
    expect(await startStepRecording(now)).toBe(false);
    expect(mockCheckpoint).toEqual(lastCheckIn);
  });
});

describe('formatting', () => {
  it('formats steps', () => {
    expect(formatSteps(0)).toBe('0');
    expect(formatSteps(980)).toBe('980');
    expect(formatSteps(12480)).toBe('12,480');
    expect(formatSteps(1234567.4)).toBe('1,234,567');
    expect(formatStepsShort(980)).toBe('980');
    expect(formatStepsShort(12480)).toBe('12.5k');
  });

  it('describes signals on one line when they share a window', () => {
    const from = lastCheckIn.toISOString();
    expect(
      describeSignals({ ...base, unlocks: 23, unlocksFrom: from, steps: 1240, stepsFrom: from }),
    ).toEqual(['📱 23 unlocks · 👟 1,240 steps since Wed 21:00']);
  });

  it('describes signals separately when windows differ, and handles singulars', () => {
    const later = new Date(2026, 9, 1, 7, 5).toISOString();
    expect(
      describeSignals({
        ...base,
        unlocks: 1,
        unlocksFrom: lastCheckIn.toISOString(),
        steps: 1,
        stepsFrom: later,
      }),
    ).toEqual(['📱 1 unlock since Wed 21:00', '👟 1 step since 07:05']);
    expect(describeSignals(base)).toEqual([]);
  });
});

describe('steps in entries, stats and prompt', () => {
  const from = lastCheckIn.toISOString();

  it('parses step fields and rejects bad ones', () => {
    const raw = { ...base, steps: 2480, stepsFrom: from };
    expect(parseEntry(raw)).toEqual(raw);
    expect(parseEntry({ ...base, steps: 2.5, stepsFrom: from })).toBeNull();
    expect(parseEntry({ ...base, steps: -3, stepsFrom: from })).toBeNull();
    expect(parseEntry({ ...base, steps: 10 })).toBeNull();
    expect(parseEntry({ ...base, stepsFrom: from })).toBeNull();
  });

  it('averages steps per check-in and per slot', () => {
    const stats = weeklyStats(
      [
        { ...base, steps: 1000, stepsFrom: from },
        { ...base, date: '2026-09-30', steps: 3000, stepsFrom: from },
        { ...base, slot: 'evening', steps: 500, stepsFrom: from },
        { ...base, slot: 'afternoon' },
      ],
      '2026-10-01',
    );
    expect(stats.stepAverage).toBe(1500);
    expect(stats.slotStepAverages).toEqual({ morning: 2000, afternoon: null, evening: 500 });
  });

  it('adds steps to the prompt, in every voice', () => {
    const stats = weeklyStats([{ ...base, steps: 2480, stepsFrom: from }], '2026-10-01');
    for (const voice of Object.values(VOICES)) {
      const prompt = buildReflectionPrompt(stats, voice);
      expect(prompt).toContain('morning: 4/5, 2480 steps since previous check-in');
      expect(prompt).toContain('Average steps between check-ins: 2480.');
      expect(prompt).toContain('how much I walked');
      expect(prompt).not.toContain('unlocked my phone');
    }
  });

  it('mentions both signals when both are present', () => {
    const stats = weeklyStats(
      [{ ...base, steps: 2480, stepsFrom: from, unlocks: 9, unlocksFrom: from }],
      '2026-10-01',
    );
    const prompt = buildReflectionPrompt(stats);
    expect(prompt).toContain(
      'morning: 4/5, 9 phone unlocks since previous check-in, 2480 steps since previous check-in',
    );
    expect(prompt).toContain('how often I unlocked my phone, how much I walked, anything in the notes');
  });
});
