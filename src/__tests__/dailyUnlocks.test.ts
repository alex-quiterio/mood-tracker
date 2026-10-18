import { describe, expect, it } from '@jest/globals';

import { parseExport, serializeExport } from '@domain/checkins/exportFormat';
import { Entry, Mood, Slot } from '@domain/checkins/types';
import {
  CapturedDay,
  countIn,
  dailyUnlocks,
  dayBounds,
  daysToCapture,
  mergeCapturedDays,
  unlockWindows,
} from '@domain/signals/dailyUnlocks';
import {
  MIN_COMPLETE_DAYS,
  UnlockBand,
  insightUntil,
  moodUnlockPattern,
  unlockBand,
  unlockInsight,
} from '@domain/signals/unlockBenchmarks';

const at = (date: string, hour: number, minute = 0) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute).toISOString();
};

const entry = (
  date: string,
  slot: Slot,
  from: string,
  recordedAt: string,
  unlocks: number,
  extra: Partial<Entry> = {},
): Entry => ({ date, slot, mood: 3, recordedAt, unlocks, unlocksFrom: from, ...extra });

/** Three check-ins a day chained by their checkpoints, the night in the morning window. */
function chainedDay(date: string, prevEvening: string, counts: [number, number, number], mood: Mood = 3) {
  return [
    entry(date, 'morning', prevEvening, at(date, 8), counts[0], { mood }),
    entry(date, 'afternoon', at(date, 8), at(date, 13), counts[1], { mood }),
    entry(date, 'evening', at(date, 13), at(date, 20), counts[2], { mood }),
  ];
}

describe('unlock windows', () => {
  it('end where the next one starts, not at a moved recordedAt', () => {
    // 2026-10-01 as saved: the morning edited at 16:22 though its window ended at 10:02.
    const entries = [
      entry('2026-10-01', 'morning', at('2026-10-01', 10, 0), at('2026-10-01', 16, 22), 0),
      entry('2026-10-01', 'afternoon', at('2026-10-01', 10, 2), at('2026-10-01', 15, 8), 40, { steps: 2633 }),
    ];
    const windows = unlockWindows(entries);
    // The morning's zero is on a day with 2,633 steps: missing, not zero.
    expect(windows.map((w) => w.entry.slot)).toEqual(['afternoon']);
    expect(windows[0].end).toBe(Date.parse(at('2026-10-01', 15, 8)));
  });

  it('keeps a zero on a quiet day', () => {
    const entries = [
      entry('2026-10-04', 'morning', at('2026-10-03', 21), at('2026-10-04', 7), 0, { steps: 40 }),
    ];
    expect(unlockWindows(entries)).toHaveLength(1);
  });

  it('never count overlapping time twice', () => {
    // An evening check-in recorded the next afternoon overlaps that morning and afternoon.
    const day = '2026-10-02';
    const entries = [
      entry('2026-10-01', 'evening', at('2026-10-01', 13), at(day, 18, 47), 62),
      entry(day, 'morning', at('2026-10-01', 19), at(day, 8), 48),
      entry(day, 'afternoon', at(day, 8), at(day, 14), 25),
    ];
    const windows = unlockWindows(entries);
    expect(windows[0].end).toBe(Date.parse(at('2026-10-01', 19)));
    const { start, end } = { start: Date.parse(at('2026-10-01', 13)), end: Date.parse(at(day, 14)) };
    const { unlocks, coveredMs } = countIn(windows, start, end);
    expect(coveredMs).toBe(end - start);
    expect(unlocks).toBeCloseTo(62 + 48 + 25);
  });

  it('count time two windows share once, even when they start together', () => {
    const windows = unlockWindows([
      entry('2026-10-01', 'evening', at('2026-10-01', 13), at('2026-10-02', 8), 62),
      entry('2026-10-02', 'morning', at('2026-10-01', 13), at('2026-10-02', 8), 48),
    ]);
    const { unlocks } = countIn(windows, Date.parse(at('2026-10-01', 0)), Date.parse(at('2026-10-03', 0)));
    expect([62, 48]).toContainEqual(Math.round(unlocks));
  });

  it('take the shorter window where two cover the same time', () => {
    const windows = unlockWindows([
      entry('2026-10-05', 'morning', at('2026-10-05', 6), at('2026-10-05', 12), 60),
    ]).concat(
      unlockWindows([entry('2026-10-05', 'afternoon', at('2026-10-05', 9), at('2026-10-05', 10), 3)]),
    );
    const { start, end } = dayBounds('2026-10-05');
    // 6–9 and 10–12 from the long window (10/hour), 9–10 from the short one.
    expect(countIn(windows, start, end).unlocks).toBeCloseTo(30 + 3 + 20);
  });
});

describe('daily unlocks', () => {
  const entries = [
    ...chainedDay('2026-10-05', at('2026-10-04', 20), [12, 30, 30]),
    ...chainedDay('2026-10-06', at('2026-10-05', 20), [12, 25, 35]),
  ];
  const now = new Date(2026, 9, 7, 9);

  it('estimates days from the windows, split across midnight by time', () => {
    const series = dailyUnlocks(entries, [], now);
    const oct5 = series.find((d) => d.date === '2026-10-05')!;
    // 20:00–08:00 window of 12: 8 of its hours fall on the 5th, 4 on the 4th.
    expect(oct5).toEqual({
      date: '2026-10-05',
      unlocks: 8 + 30 + 30 + 4 * (12 / 12),
      estimated: true,
      complete: true,
    });
  });

  it('mark days without full coverage incomplete', () => {
    const series = dailyUnlocks(entries, [], now);
    expect(series.find((d) => d.date === '2026-10-04')).toMatchObject({ estimated: true, complete: false });
    // The 6th ends at 20:00 with nothing after it.
    expect(series.find((d) => d.date === '2026-10-06')).toMatchObject({ complete: false });
  });

  it('prefer days read whole from the phone, unless a zero on an active day', () => {
    const captured: CapturedDay[] = [
      { date: '2026-10-05', unlocks: 77 },
      { date: '2026-10-06', unlocks: 0 },
    ];
    const withSteps = entries.map((e) => (e.date === '2026-10-06' ? { ...e, steps: 2000 } : e));
    const series = dailyUnlocks(withSteps, captured, now);
    expect(series.find((d) => d.date === '2026-10-05')).toEqual({
      date: '2026-10-05',
      unlocks: 77,
      estimated: false,
      complete: true,
    });
    expect(series.find((d) => d.date === '2026-10-06')).toMatchObject({ estimated: true });
  });

  it('leave out today', () => {
    expect(dailyUnlocks(entries, [{ date: '2026-10-07', unlocks: 3 }], now).map((d) => d.date)).not.toContain(
      '2026-10-07',
    );
  });
});

describe('capturing whole days', () => {
  it('asks for the finished days within the phone’s week, newest first, skipping known ones', () => {
    const now = new Date(2026, 9, 8, 9);
    const week = 7 * 24 * 3_600_000;
    expect(daysToCapture([{ date: '2026-10-06', unlocks: 1 }], now, week)).toEqual([
      '2026-10-07',
      '2026-10-05',
      '2026-10-04',
      '2026-10-03',
      '2026-10-02',
    ]);
  });

  it('keeps the first value for a day', () => {
    expect(
      mergeCapturedDays([{ date: '2026-10-01', unlocks: 5 }], [{ date: '2026-10-01', unlocks: 9 }]),
    ).toEqual([{ date: '2026-10-01', unlocks: 5 }]);
  });
});

describe('unlock bands', () => {
  it.each([
    [24, 'low'],
    [25, 'typical'],
    [55, 'typical'],
    [56, 'above'],
    [100, 'above'],
    [101, 'heavy'],
    [24.4, 'low'],
    [24.6, 'typical'],
    [0, 'low'],
  ] as [number, UnlockBand][])('%d a day is %s', (n, band) => {
    expect(unlockBand(n)).toBe(band);
  });
});

describe('unlock insight', () => {
  const day = (date: string, unlocks: number, complete = true, estimated = false) => ({
    date,
    unlocks,
    complete,
    estimated,
  });

  it('averages only complete days in the 7 ending at `until`', () => {
    const series = [
      day('2026-10-01', 500), // outside the week
      day('2026-10-02', 60),
      day('2026-10-03', 70),
      day('2026-10-04', 80, true, true),
      day('2026-10-05', 60),
      day('2026-10-06', 80),
      day('2026-10-07', 5, false),
    ];
    expect(unlockInsight(series, '2026-10-08')).toEqual({
      kind: 'band',
      average: 70,
      band: 'above',
      median: 41,
      completeDays: 5,
      estimatedDays: 1,
    });
  });

  it('is hidden with fewer than 5 complete days', () => {
    expect(MIN_COMPLETE_DAYS).toBe(5);
    const series = [
      day('2026-10-04', 40),
      day('2026-10-05', 40),
      day('2026-10-06', 40),
      day('2026-10-07', 40),
      day('2026-10-08', 40, false),
    ];
    expect(unlockInsight(series, '2026-10-08')).toEqual({ kind: 'notEnough', completeDays: 4 });
  });

  it('ends this week yesterday, and a past week on its Sunday', () => {
    expect(insightUntil('2026-10-18', '2026-10-18')).toBe('2026-10-17');
    expect(insightUntil('2026-10-11', '2026-10-18')).toBe('2026-10-11');
  });
});

describe('mood pattern', () => {
  const afternoon = (date: string, mood: Mood, unlocks: number) =>
    entry(date, 'afternoon', at(date, 12), at(date, 14), unlocks, { mood });

  it('compares unlocks per hour once each group has 5 daytime check-ins', () => {
    const low = ['01', '02', '03', '04', '05'].map((d) => afternoon(`2026-10-${d}`, 2, 10));
    const high = ['06', '07', '08', '09'].map((d) => afternoon(`2026-10-${d}`, 4, 4));
    // A morning window across the night is left out, so it doesn't make five.
    const night = entry('2026-10-10', 'morning', at('2026-10-09', 22), at('2026-10-10', 7), 2, { mood: 5 });
    expect(moodUnlockPattern(unlockWindows([...low, ...high, night]))).toBeNull();

    const enough = [...low, ...high, afternoon('2026-10-11', 5, 4)];
    expect(moodUnlockPattern(unlockWindows(enough))).toEqual({
      low: { perHour: 5, checkIns: 5 },
      high: { perHour: 2, checkIns: 5 },
    });
  });
});

describe('daily unlocks in exports', () => {
  it('round-trip in version 6, keeping only the days read whole', () => {
    const file = serializeExport({
      entries: [],
      habits: [],
      dailyUnlocks: [
        { date: '2026-10-05', unlocks: 40, estimated: false, complete: true },
        { date: '2026-10-06', unlocks: 38, estimated: true, complete: true },
      ],
    });
    expect(JSON.parse(file).version).toBe(6);
    expect(JSON.parse(file).dailyUnlocks).toHaveLength(2);
    expect(parseExport(file).dailyUnlocks).toEqual([{ date: '2026-10-05', unlocks: 40 }]);
  });

  it('still imports version 5 files, which have none', () => {
    const v5 = JSON.stringify({
      format: 'mood-tracker-export',
      version: 5,
      exportedAt: '2026-10-08T10:00:00.000Z',
      entries: [entry('2026-10-01', 'afternoon', at('2026-10-01', 10), at('2026-10-01', 15), 40)],
      habits: [],
      urges: [],
      payments: [],
    });
    const imported = parseExport(v5);
    expect(imported.entries).toHaveLength(1);
    expect(imported.dailyUnlocks).toEqual([]);
  });
});
