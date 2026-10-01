import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { StepReading } from '../../modules/step-counter';
import { parseEntry } from '../entries';
import { buildReflectionPrompt } from '../prompt';
import { describeSignals } from '../signals';
import { weeklyStats } from '../stats';
import {
  checkpointFrom,
  formatSteps,
  formatStepsShort,
  previewSteps,
  resetStepCheckpoint,
  stepsSince,
  withSteps,
} from '../steps';
import type { StepCheckpoint } from '../storage';
import { Entry } from '../types';
import { VOICES } from '../voices';

const mockRead = jest.fn<() => Promise<StepReading | null>>();
jest.mock('../../modules/step-counter', () => ({
  stepCounter: { read: () => mockRead() },
}));

let mockCheckpoint: StepCheckpoint | null = null;
jest.mock('../storage', () => ({
  loadStepCheckpoint: async () => mockCheckpoint,
  saveStepCheckpoint: async (cp: StepCheckpoint) => {
    mockCheckpoint = cp;
  },
  // unlocks.ts is imported for isLiveCheckIn; its storage calls aren't used here.
  loadUnlockCheckpoint: async () => null,
  saveUnlockCheckpoint: async () => {},
}));

const BOOT = Date.UTC(2026, 8, 28, 6, 0); // phone booted Mon 28 Sep
const now = new Date(2026, 9, 1, 9, 30); // Thu 1 Oct 09:30 local: a morning check-in
const lastCheckIn = new Date(2026, 8, 30, 21, 0); // Wed 21:00 local
const base: Entry = { date: '2026-10-01', slot: 'morning', mood: 4, recordedAt: now.toISOString() };
const cp = (steps: number, at = lastCheckIn, bootTime = BOOT): StepCheckpoint => ({
  steps,
  bootTime,
  at: at.toISOString(),
});

beforeEach(() => {
  mockRead.mockReset();
  mockCheckpoint = null;
});

describe('stepsSince', () => {
  it('subtracts the checkpoint reading', () => {
    expect(stepsSince(cp(10_000), { steps: 12_480, bootTime: BOOT })).toEqual({
      steps: 2480,
      from: lastCheckIn,
    });
  });

  it('tolerates small boot-time wobble', () => {
    expect(stepsSince(cp(10_000), { steps: 10_500, bootTime: BOOT + 30_000 }).steps).toBe(500);
  });

  it('counts since boot when the counter went backwards (reboot)', () => {
    const bootTime = Date.UTC(2026, 9, 1, 5, 0);
    expect(stepsSince(cp(10_000), { steps: 800, bootTime })).toEqual({
      steps: 800,
      from: new Date(bootTime),
    });
  });

  it('counts since boot when the boot time changed, even if the counter is higher', () => {
    const bootTime = Date.UTC(2026, 9, 1, 5, 0);
    expect(stepsSince(cp(100), { steps: 900, bootTime })).toEqual({ steps: 900, from: new Date(bootTime) });
  });

  it('rounds the float the sensor reports', () => {
    expect(stepsSince(cp(10.4), { steps: 20.6, bootTime: BOOT }).steps).toBe(10);
  });
});

describe('withSteps', () => {
  it('counts since the checkpoint and moves it to now', async () => {
    mockCheckpoint = cp(10_000);
    mockRead.mockResolvedValue({ steps: 12_480, bootTime: BOOT });
    const entry = await withSteps(base, undefined, true, now);
    expect(entry).toMatchObject({ steps: 2480, stepsFrom: lastCheckIn.toISOString() });
    expect(mockCheckpoint).toEqual(cp(12_480, now));
  });

  it('on the first count only sets the checkpoint', async () => {
    mockRead.mockResolvedValue({ steps: 5_000, bootTime: BOOT });
    expect(await withSteps(base, undefined, true, now)).toEqual(base);
    expect(mockCheckpoint).toEqual(cp(5_000, now));
  });

  it('keeps the first count when an entry is edited, even with tracking off', async () => {
    const existing = { ...base, steps: 2480, stepsFrom: lastCheckIn.toISOString() };
    const entry = await withSteps({ ...base, mood: 2 }, existing, false, now);
    expect(entry).toMatchObject({ mood: 2, steps: 2480, stepsFrom: lastCheckIn.toISOString() });
    expect(mockRead).not.toHaveBeenCalled();
  });

  it('skips counting when off and for back-filled or other-slot entries', async () => {
    mockRead.mockResolvedValue({ steps: 12_480, bootTime: BOOT });
    expect(await withSteps(base, undefined, false, now)).toEqual(base);
    expect(await withSteps({ ...base, date: '2026-09-30' }, undefined, true, now)).not.toHaveProperty(
      'steps',
    );
    expect(await withSteps({ ...base, slot: 'evening' }, undefined, true, now)).not.toHaveProperty('steps');
    expect(mockRead).not.toHaveBeenCalled();
  });

  it('keeps the checkpoint when there is no reading', async () => {
    mockCheckpoint = cp(10_000);
    mockRead.mockResolvedValue(null);
    expect(await withSteps(base, undefined, true, now)).toEqual(base);
    expect(mockCheckpoint).toEqual(cp(10_000));
  });

  it('never throws', async () => {
    mockRead.mockRejectedValue(new Error('sensor exploded'));
    expect(await withSteps(base, undefined, true, now)).toEqual(base);
  });
});

describe('previewSteps and resetStepCheckpoint', () => {
  it('previews the current window without moving the checkpoint', async () => {
    mockCheckpoint = cp(10_000);
    mockRead.mockResolvedValue({ steps: 10_250, bootTime: BOOT });
    expect(await previewSteps()).toEqual({ count: 250, from: lastCheckIn });
    expect(mockCheckpoint).toEqual(cp(10_000));
  });

  it('is null without a checkpoint or a reading', async () => {
    mockRead.mockResolvedValue({ steps: 10_250, bootTime: BOOT });
    expect(await previewSteps()).toBeNull();
    mockCheckpoint = cp(10_000);
    mockRead.mockResolvedValue(null);
    expect(await previewSteps()).toBeNull();
  });

  it('reset starts counting from now', async () => {
    mockRead.mockResolvedValue({ steps: 7_000, bootTime: BOOT });
    await resetStepCheckpoint(now);
    expect(mockCheckpoint).toEqual(checkpointFrom({ steps: 7_000, bootTime: BOOT }, now));
  });

  it('reset leaves things alone without a reading', async () => {
    mockCheckpoint = cp(10_000);
    mockRead.mockResolvedValue(null);
    await resetStepCheckpoint(now);
    expect(mockCheckpoint).toEqual(cp(10_000));
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
